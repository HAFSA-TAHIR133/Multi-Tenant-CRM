import { fetchApi } from "../../../api/fetchApiHelper.jsx";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export const profileApi = {
  getProfile: () =>
    fetchApi("/profile", {
      method: "GET",
    }),

  updateProfile: (payload) =>
    fetchApi("/profile", {
      method: "PUT",
      body: payload,
    }),

  changePassword: (payload) =>
    fetchApi("/profile/change-password", {
      method: "PUT",
      body: payload,
    }),

  uploadAvatar: async (file) => {
    const uploadData = new FormData();
    uploadData.append("avatar", file);

    // Using fetchApi ensures auth headers/credentials match your auth flow exactly.
    // Setting body to FormData lets fetchApi send multipart/form-data automatically.
    return await fetchApi("/profile/avatar", {
      method: "POST",
      body: uploadData,
    });
  },
};