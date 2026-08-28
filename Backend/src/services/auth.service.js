import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User, Tenant, Profile, RefreshToken } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import * as jwtUtils from '../utils/index.js';
import { sendEmail } from '../utils/email.js';
import { Op } from 'sequelize';

const createTokens = (payload) => {
  const accessToken = jwtUtils.generateAccessToken(payload);
  const refreshToken = jwtUtils.generateRefreshToken({
    userId: payload.userId,
  });

  return { accessToken, refreshToken };
};

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

// Common User Relations Include Array
const userInclusions = [
  {
    model: Tenant,
    as: 'tenant',
    attributes: ['id', 'name', 'slug', 'status'],
    required: false,
  },
  {
    model: Profile,
    as: 'profile',
    required: false,
  },
];

/**
 * Format tenant data
 */
const formatTenant = (user) => {
  if (user.tenant) {
    return {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      status: user.tenant.status,
    };
  }

  // Virtual tenant mapping for Super Admin
  if (user.role === UserRole.SUPERADMIN) {
    return {
      id: null,
      name: 'System Portal',
      slug: 'system-portal',
      status: 'active',
    };
  }

  return null;
};

/**
 * Get tenant name
 *
 * For normal users: user.tenant.name
 * For Super Admin: System Portal
 */
const getTenantName = (user) => {
  if (user.tenant?.name) {
    return user.tenant.name;
  }

  if (user.role === UserRole.SUPERADMIN) {
    return 'System Portal';
  }

  return null;
};

const finalizeLogin = async (user) => {
  // Check user status
  if (!user.isActive) {
    const err = new Error('User is inactive');
    err.code = ErrorCodesMeta.UNAUTHORIZED.code;
    throw err;
  }

  // Check tenant status
  if (
    user.tenant &&
    String(user.tenant.status || '').toLowerCase() === 'inactive'
  ) {
    const err = new Error(ErrorCodesMeta.TENANT_INACTIVE.message);
    err.code = ErrorCodesMeta.TENANT_INACTIVE.code;
    throw err;
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Extract tenant name
  const tenantName = getTenantName(user);

  // JWT payload
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantName,
    name: user.name,
  };

  const { accessToken, refreshToken } = createTokens(payload);

  const refreshExpiryDays = Number(
    process.env.JWT_REFRESH_EXPIRY_DAYS || 7
  );

  const expiresAt = new Date(
    Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt,
    revoked: false,
  });

  // Response payload sent to client
  return {
    accessToken,
    refreshToken,

    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,

      // Direct tenant name field
      tenantName,

      // Structured tenant details
      tenant: formatTenant(user),

      // Profile entity
      profile: user.profile || null,
    },
  };
};

export const AuthService = {
  // ============================================================
  // CREATE USER
  // ============================================================

  async createUser(userData, creator) {
    const {
      name,
      email,
      password,
      role,
      tenantId,
      isActive = true,
      emailVerified = false,
      profile = {},
    } = userData;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const allowedRoles = [
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ];

    if (!allowedRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Admin authorization checks
    if (creator.role === UserRole.ADMIN) {
      if (role !== UserRole.USER) {
        throw new Error('Admins can only create regular users');
      }

      if (tenantId && tenantId !== creator.tenantId) {
        throw new Error(
          'Admins can only create users in their own tenant'
        );
      }
    }

    // Super Admin creating Admin checks
    if (
      creator.role === UserRole.SUPERADMIN &&
      !tenantId &&
      role === UserRole.ADMIN
    ) {
      throw new Error(
        'Tenant ID is required when creating an admin user'
      );
    }

    // Check existing user conflict
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const err = new Error(
        ErrorCodesMeta.USER_ALREADY_EXISTS.message
      );
      err.code = ErrorCodesMeta.USER_ALREADY_EXISTS.code;
      throw err;
    }

    // Hash user password manually
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      tenantId: tenantId || null,
      isActive,
      emailVerified,
      lastLogin: null,
    });

    // Create profile record if provided
    if (profile && Object.keys(profile).length > 0) {
      await Profile.create({
        userId: user.id,
        firstName: profile.firstName || null,
        lastName: profile.lastName || null,
        phone: profile.phone || null,
        avatar: profile.avatar || null,
        designation: profile.designation || null,
        department: profile.department || null,
      });
    }

    return user;
  },

  // ============================================================
  // LOGIN
  // ============================================================

  async login(email, password) {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: userInclusions,
    });

    if (!user) {
      const err = new Error(
        ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.message
      );
      err.code = ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.code;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const err = new Error(
        ErrorCodesMeta.YOUR_PASSWORD_IS_INCORRECT.message
      );
      err.code = ErrorCodesMeta.YOUR_PASSWORD_IS_INCORRECT.code;
      throw err;
    }

    return finalizeLogin(user);
  },

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  async googleLogin(code) {
    if (!code) {
      const err = new Error('Google authorization code is required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    let tokenResponse;

    try {
      tokenResponse = await googleClient.getToken({
        code,
        redirect_uri: 'postmessage',
      });
    } catch (err) {
      const error = new Error('Invalid Google credential');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const idToken = tokenResponse?.tokens?.id_token;

    if (!idToken) {
      const error = new Error('Invalid Google credential');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      const error = new Error('Invalid Google credential');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const payload = ticket.getPayload();
    const email = payload?.email ? payload.email.toLowerCase().trim() : '';

    if (!email) {
      const error = new Error('Google account has no email');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const user = await User.findOne({
      where: { email },
      include: userInclusions,
    });

    if (!user) {
      const err = new Error(
        'Your account is not registered. Please contact your administrator.'
      );
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return finalizeLogin(user);
  },

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refreshToken(refreshToken) {
    let decoded;

    try {
      decoded = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const stored = await RefreshToken.findOne({
      where: {
        userId: decoded.userId,
        token: refreshToken,
        revoked: false,
        expiresAt: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          include: userInclusions,
        },
      ],
    });

    if (!stored) {
      const error = new Error('Invalid or revoked refresh token');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const user = stored.user;

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    // Check tenant status
    if (
      user.tenant &&
      String(user.tenant.status || '').toLowerCase() === 'inactive'
    ) {
      const error = new Error(ErrorCodesMeta.TENANT_INACTIVE.message);
      error.code = ErrorCodesMeta.TENANT_INACTIVE.code;
      throw error;
    }

    const tenantName = getTenantName(user);

    // Build refreshed payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName,
      name: user.name,
    };

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = createTokens(payload);

    const refreshExpiryDays = Number(
      process.env.JWT_REFRESH_EXPIRY_DAYS || 7
    );

    const newExpiresAt = new Date(
      Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000
    );

    const sequelize = RefreshToken.sequelize;

    await sequelize.transaction(async (t) => {
      // Revoke existing token
      await RefreshToken.update(
        { revoked: true },
        {
          where: { id: stored.id },
          transaction: t,
        }
      );

      // Create new refresh token entry
      await RefreshToken.create(
        {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: newExpiresAt,
          revoked: false,
        },
        { transaction: t }
      );
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,

      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName,
        tenant: formatTenant(user),
        profile: user.profile || null,
      },
    };
  },

  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(refreshToken) {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { token: refreshToken } }
    );

    return {
      success: (result[0] || 0) > 0,
    };
  },

  // ============================================================
  // LOGOUT ALL SESSIONS
  // ============================================================

  async logoutAll(userId) {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { userId } }
    );

    return {
      count: result[0] || 0,
    };
  },

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  async forgotPassword(email) {
    if (!email) {
      return {
        message:
          'If an account exists with this email, an OTP has been sent.',
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        message:
          'If an account exists with this email, an OTP has been sent.',
      };
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 10px;">
            Password Reset Request
          </h2>
          <p style="color: #475569; font-size: 14px;">
            Use the verification code below to reset your password.
            This code is valid for 10 minutes.
          </p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">
              ${otp}
            </span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            If you didn't request a password reset,
            you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return {
      message:
        'If an account exists with this email, an OTP has been sent.',
    };
  },

  // ============================================================
  // VERIFY RESET OTP
  // ============================================================

  async verifyResetOtp(email, otp) {
    if (!email || !otp) {
      const err = new Error('Email and OTP are required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      user.resetOtp !== hashedOtp ||
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires) < new Date()
    ) {
      const err = new Error('Invalid or expired OTP');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    return {
      message: 'OTP verified successfully',
    };
  },

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      const err = new Error('All fields are required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      user.resetOtp !== hashedOtp ||
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires) < new Date()
    ) {
      const err = new Error('Invalid or expired session');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    // Explicit single-hash update to prevent double-hashing hooks
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.update(
      {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
      },
      {
        where: { id: user.id },
        individualHooks: false, // Prevents Sequelize model hooks from running again
      }
    );

    return {
      message: 'Password updated successfully',
    };
  },

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  async getMe(userId) {
    const user = await User.findByPk(userId, {
      include: userInclusions,
    });

    if (!user) {
      const err = new Error('User not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const tenantName = getTenantName(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName,
        tenant: formatTenant(user),
        profile: user.profile || null,
      },
    };
  },
};