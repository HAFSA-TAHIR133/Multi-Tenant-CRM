import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, Tenant, Profile, RefreshToken } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import * as jwtUtils from '../utils/index.js';
import { Op } from 'sequelize';

const createTokens = (payload) => {
  const accessToken = jwtUtils.generateAccessToken(payload);
  const refreshToken = jwtUtils.generateRefreshToken({ userId: payload.userId });
  return { accessToken, refreshToken };
};

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

/**
 * Shared post-verification login flow.
 * Validates user/tenant status, generates tokens, stores refresh token,
 * and returns the exact same response shape used by email/password login.
 */
const finalizeLogin = async (user) => {
  if (!user.isActive) {
    const err = new Error('User is inactive');
    err.code = ErrorCodesMeta.UNAUTHORIZED.code;
    throw err;
  }

  if (
    user.tenant &&
    String(user.tenant.status || '').toLowerCase() === 'inactive'
  ) {
    const err = new Error(ErrorCodesMeta.TENANT_INACTIVE.message);
    err.code = ErrorCodesMeta.TENANT_INACTIVE.code;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
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

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    },
  };
};

export const AuthService = {
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

    const allowedRoles = [UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN];
    if (!allowedRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Admin can only create USER role in their own tenant
    if (creator.role === UserRole.ADMIN) {
      if (role !== UserRole.USER) {
        throw new Error('Admins can only create regular users');
      }
      if (tenantId && tenantId !== creator.tenantId) {
        throw new Error('Admins can only create users in their own tenant');
      }
    }

    if (
      creator.role === UserRole.SUPERADMIN &&
      !tenantId &&
      role === UserRole.ADMIN
    ) {
      throw new Error('Tenant ID is required when creating an admin user');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const err = new Error(ErrorCodesMeta.USER_ALREADY_EXISTS.message);
      err.code = ErrorCodesMeta.USER_ALREADY_EXISTS.code;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      tenantId: tenantId || null,
      isActive,
      emailVerified,
      lastLogin: null,
    });

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

  async login(email, password) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Tenant, as: 'tenant', required: false }],
    });

    if (!user) {
      const err = new Error(ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.message);
      err.code = ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.code;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error(ErrorCodesMeta.YOUR_PASSWORD_IS_INCORRECT.message);
      err.code = ErrorCodesMeta.YOUR_PASSWORD_IS_INCORRECT.code;
      throw err;
    }

    return finalizeLogin(user);
  },

  async googleLogin(code) {
    if (!code) {
      const err = new Error('Google authorization code is required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    // Exchange the authorization code for tokens (ID token + access token)
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
    const email = payload?.email;

    if (!email) {
      const error = new Error('Google account has no email');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Tenant, as: 'tenant', required: false }],
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
        expiresAt: { [Op.gte]: new Date() },
      },
      include: { model: User, as: 'user' },
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

    const tenant = user.tenantId
      ? await Tenant.findByPk(user.tenantId)
      : null;
    if (
      tenant &&
      String(tenant.status || '').toLowerCase() === 'inactive'
    ) {
      const error = new Error(ErrorCodesMeta.TENANT_INACTIVE.message);
      error.code = ErrorCodesMeta.TENANT_INACTIVE.code;
      throw error;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    };

    const { accessToken, refreshToken: newRefreshToken } = createTokens(payload);

    // Rotate refresh token atomically: revoke old, create new
    const refreshExpiryDays = Number(
      process.env.JWT_REFRESH_EXPIRY_DAYS || 7
    );

    const newExpiresAt = new Date(
      Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000
    );

    // Use a transaction to ensure rotation is atomic
    const sequelize = RefreshToken.sequelize;
    await sequelize.transaction(async (t) => {
      await RefreshToken.update(
        { revoked: true },
        { where: { id: stored.id }, transaction: t }
      );

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
      },
    };
  },

  async logout(refreshToken) {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { token: refreshToken } }
    );

    return { success: (result[0] || 0) > 0 };
  },

  async logoutAll(userId) {
    const result = await RefreshToken.update(
      { revoked: true },
      { where: { userId } }
    );

    return { count: result[0] || 0 };
  },

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const err = new Error(ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.message);
      err.code = ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.code;
      throw err;
    }

    // In production: generate reset token, store hashed, send email
    const resetToken = jwtUtils.generateAccessToken({
      userId: user.id,
      type: 'password_reset',
    });

    return {
      message: 'Password reset link generated',
      //   resetToken,  remove in production; send via email only
    };
  },

  async resetPassword(token, newPassword) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const error = new Error('Invalid or expired reset token');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    if (decoded.type !== 'password_reset') {
      const error = new Error('Invalid token type');
      error.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw error;
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      const err = new Error(ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.message);
      err.code = ErrorCodesMeta.USER_NOT_EXISTS_WITH_THIS_EMAIL.code;
      throw err;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return { message: 'Password updated successfully' };
  },
};