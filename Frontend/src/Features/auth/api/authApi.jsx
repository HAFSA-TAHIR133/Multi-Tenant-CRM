import { fetchApi } from "../../../api/fetchApiHelper.jsx";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export const authApi = {
  login: (credentials) =>
    fetchApi("/auth/login", {
      method: "POST",
      body: credentials,
    }),

  googleLogin: (code) =>
    fetchApi("/auth/google", {
      method: "POST",
      body: { code },
    }),

  register: (payload) =>
    fetchApi("/auth/register", {
      method: "POST",
      body: payload,
    }),

  // --- Password Reset API Calls ---
  forgotPassword: (email) =>
    fetchApi("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  verifyOtp: (email, otp) =>
    fetchApi("/auth/verify-otp", {
      method: "POST",
      body: { email, otp },
    }),

  resetPassword: (email, otp, password) =>
    fetchApi("/auth/reset-password", {
      method: "POST",
      body: { email, otp, password },
    }),

  refresh: async () => {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const error = new Error(
        data?.message || "Unable to refresh access token"
      );
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data.data || data;
  },

  logout: () =>
    fetchApi("/auth/logout", {
      method: "POST",
    }),
};