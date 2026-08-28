import { Profile, User } from "../models/index.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/fileStorage.js";
import bcrypt from "bcryptjs";

export const fetchUserProfile = async (userId) => {
  // Explicitly specify attributes to eliminate key collisions and hide sensitive data
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "role"],
    include: [
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
      },
    ],
  });

  return user;
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

  // Refetch clean, mapped structure
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