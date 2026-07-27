import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Profile, Tenant } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const UserService = {
  async createUser(data, creator) {
    const {
      name,
      email,
      password,
      role,
      tenantId,
      isActive = true,
      emailVerified = false,
      profile = {},
    } = data;

    if (!name || !email || !password || !role) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const err = new Error(ErrorCodesMeta.USER_ALREADY_EXISTS.message);
      err.code = ErrorCodesMeta.CONFLICT.code;
      throw err;
    }

    if (creator.role === UserRole.ADMIN) {
      if (tenantId && String(tenantId) !== String(creator.tenantId)) {
        const err = new Error('Admins can only create users in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    }

    const finalTenantId = creator.role === UserRole.SUPERADMIN ? tenantId : creator.tenantId;

    if (!finalTenantId) {
      const err = new Error('tenantId is required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const tenant = await Tenant.findByPk(finalTenantId);
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      tenantId: finalTenantId,
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

  async getAllUsers(user) {
    const where = {};

    if (user.role === UserRole.ADMIN) {
      where.tenantId = user.tenantId;
    }

    const users = await User.findAll({
      where,
      include: [{ model: Profile, as: 'profile', required: false }],
      order: [['createdAt', 'DESC']],
    });
    console.log(users);

    return users;
  },

  async getUserById(id, user) {
    const targetUser = await User.findByPk(id, {
      include: [
        { model: Profile, as: 'profile', required: false },
        { model: Tenant, as: 'tenant', required: false },
      ],
    });

    if (!targetUser) {
      const err = new Error('User not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(targetUser.tenantId) !== String(user.tenantId)) {
      const err = new Error('Access denied: user is in another tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return targetUser;
  },

  async updateUser(id, data, user) {
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      const err = new Error('User not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(targetUser.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only update users in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const { name, email, password, role, tenantId, isActive, emailVerified, profile } = data;

    if (email && email !== targetUser.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        const err = new Error(ErrorCodesMeta.USER_ALREADY_EXISTS.message);
        err.code = ErrorCodesMeta.CONFLICT.code;
        throw err;
      }
    }

    if (user.role === UserRole.ADMIN && tenantId && String(tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins cannot move users to another tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const updateData = {
      name: name ?? targetUser.name,
      email: email ?? targetUser.email,
      role: role ?? targetUser.role,
      tenantId:
        user.role === UserRole.SUPERADMIN
          ? tenantId ?? targetUser.tenantId
          : targetUser.tenantId,
      isActive: isActive ?? targetUser.isActive,
      emailVerified: emailVerified ?? targetUser.emailVerified,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await targetUser.update(updateData);

    if (profile) {
      const [userProfile] = await Profile.findOrCreate({
        where: { userId: targetUser.id },
        defaults: {
          userId: targetUser.id,
          firstName: profile.firstName || null,
          lastName: profile.lastName || null,
          phone: profile.phone || null,
          avatar: profile.avatar || null,
          designation: profile.designation || null,
          department: profile.department || null,
        },
      });

      if (userProfile) {
        await userProfile.update({
          firstName: profile.firstName ?? userProfile.firstName,
          lastName: profile.lastName ?? userProfile.lastName,
          phone: profile.phone ?? userProfile.phone,
          avatar: profile.avatar ?? userProfile.avatar,
          designation: profile.designation ?? userProfile.designation,
          department: profile.department ?? userProfile.department,
        });
      }
    }

    return await User.findByPk(id, {
      include: [
        { model: Profile, as: 'profile', required: false },
        { model: Tenant, as: 'tenant', required: false },
      ],
    });
  },

  async deleteUser(id, user) {
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      const err = new Error('User not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(targetUser.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete users in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    await Profile.destroy({ where: { userId: id } });
    await targetUser.destroy();

    return { success: true };
  },
};

export default UserService;