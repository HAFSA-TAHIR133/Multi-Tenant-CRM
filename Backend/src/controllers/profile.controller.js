import * as profileService from "../services/profile.service.js";
import { httpResponse } from "../utils/httpResponse.js";

const getUserIdFromReq = (req) => {
  if (!req.user) return null;
  return req.user.id || req.user.userId || null;
};

const requireUser = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Not authenticated." });
    return null;
  }
  return userId;
};

export const getProfile = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const user = await profileService.fetchUserProfile(userId);

    if (!user) {
      return httpResponse.NOT_FOUND(res, {}, "User not found.");
    }

    return httpResponse.SUCCESS(res, user, "Profile fetched successfully.");
  } catch (error) {
    console.error("getProfile error:", error);
    return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const updatedUser = await profileService.updateUserProfile(
      userId,
      req.body
    );

    return httpResponse.SUCCESS(
      res,
      updatedUser,
      "Profile updated successfully."
    );
  } catch (error) {
    console.error("updateProfile error:", error);
    return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return httpResponse.BAD_REQUEST(
        res,
        {},
        "Current password and new password are required."
      );
    }

    await profileService.changeUserPassword(
      userId,
      currentPassword,
      newPassword
    );

    return httpResponse.SUCCESS(res, {}, "Password updated successfully.");
  } catch (error) {
    console.error("changePassword error:", error);
    return httpResponse.BAD_REQUEST(res, {}, error.message);
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    if (!req.file) {
      return httpResponse.BAD_REQUEST(res, {}, "No image file provided.");
    }

    const avatarUrl = await profileService.updateUserAvatar(
      userId,
      req.file.path
    );

    return httpResponse.SUCCESS(
      res,
      { avatar: avatarUrl },
      "Avatar updated successfully."
    );
  } catch (error) {
    console.error("uploadAvatar error:", error);
    return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
  }
};