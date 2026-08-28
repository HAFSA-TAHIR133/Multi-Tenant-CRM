import { Profile, User, Tenant } from "../models/index.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/fileStorage.js";
import bcrypt from "bcryptjs";

/**
 * Format virtual/real tenant mapping
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

  // Virtual tenant mapping for Super Admin (numeric 3 or string 'SUPERADMIN')
  if (user.role === "SUPERADMIN" || user.role === 3) {
    return {
      id: null,
      name: "System Portal",
      slug: "system-portal",
      status: "active",
    };
  }

  return null;
};

/**
 * Extract display tenant name safely
 */
const getTenantName = (user) => {
  if (user.tenant?.name) return user.tenant.name;
  if (user.role === "SUPERADMIN" || user.role === 3) return "System Portal";
  return null;
};

export const fetchUserProfile = async (userId) => {
  // Included tenantId and Tenant association to prevent frontend state drops
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "role", "tenantId"],
    include: [
      {
        model: Tenant,
        as: "tenant",
        attributes: ["id", "name", "slug", "status"],
        required: false,
      },
      {
        model: Profile,
        as: "profile",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "phone",
          "designation",
          "department",
          "avatar",
        ],
        required: false,
      },
    ],
  });

  if (!user) return null;

  const tenantName = getTenantName(user);

  // Return a structured object matching login & auth responses
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantName,
    tenant: formatTenant(user),
    profile: user.profile || null,
  };
};

export const updateUserProfile = async (userId, updateData) => {
  const { firstName, lastName, phone, designation, department } = updateData;

  let profile = await Profile.findOne({ where: { userId } });

  if (!profile) {
    await Profile.create({
      userId,
      firstName,
      lastName,
      phone,
      designation,
      department,
    });
  } else {
    await profile.update({
      firstName: firstName ?? profile.firstName,
      lastName: lastName ?? profile.lastName,
      phone: phone ?? profile.phone,
      designation: designation ?? profile.designation,
      department: department ?? profile.department,
    });
  }

  // Refetch clean, fully-mapped user structure with tenant details included
  return await fetchUserProfile(userId);
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found.");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Invalid current password.");

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return true;
};

export const updateUserAvatar = async (userId, filePath) => {
  // 1. Upload to Cloudinary
  const avatarUrl = await uploadToCloudinary(filePath, "avatars");
  if (!avatarUrl) {
    throw new Error("Failed to upload image to Cloudinary.");
  }

  // 2. Update or create Profile record
  let profile = await Profile.findOne({ where: { userId } });

  if (!profile) {
    await Profile.create({ userId, avatar: avatarUrl });
  } else {
    if (profile.avatar) {
      await deleteFromCloudinary(profile.avatar);
    }
    await profile.update({ avatar: avatarUrl });
  }

  return avatarUrl;
};