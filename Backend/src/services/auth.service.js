import bcrypt from 'bcrypt';
import { User, Tenant, Profile, RefreshToken } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
// import { generateAccessToken, generateRefreshToken, verifyRefreshToken,} from '../utils/jwt.js';
import * as jwt from '../utils/index.js';
import { Op } from 'sequelize';
// import jwt from 'jsonwebtoken';

const createTokens = (payload) => {
  const accessToken = jwt.generateAccessToken(payload);
  const refreshToken = jwt.generateRefreshToken({ userId: payload.userId });
  return { accessToken, refreshToken };
};

export const AuthService = {
  async createUser(userData, creator) {

    const {name,email,password,role,tenantId,isActive = true,emailVerified = false,profile = {},} = userData;

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

    if (!user.isActive) {
      const err = new Error('User is inactive');
      err.code = ErrorCodesMeta.UNAUTHORIZED.code;
      throw err;
    }

    if (user.tenant && user.tenant.status === 'Inactive') {
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
  },

  async refreshToken(refreshToken) {
    console.log("Incoming Refresh Token:");
    console.log(refreshToken);

    let decoded;


    try {
      decoded = jwt.verifyRefreshToken(refreshToken);
      console.log("Decoded Refresh Token:");
      console.log(decoded);
    } 
	catch (err) {
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

	const tenant = await Tenant.findByPk(user.tenantId);
	if (tenant && tenant.status === "Inactive") {
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

    //  for security purposes: rotate refresh token (revoke old, create new)
    await RefreshToken.update(
      { revoked: true },
      { where: { id: stored.id } }
    );

    const refreshExpiryDays = Number(
      process.env.JWT_REFRESH_EXPIRY_DAYS || 7
    );

    const newExpiresAt = new Date(
      Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000
    );

    await RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
      revoked: false,
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
    const resetToken = jwt.generateAccessToken({
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
    } 
	catch (err) {
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