import { fetchApi } from "../../../api/fetchApiHelper.jsx";

export const authApi = {
 
  login: (credentials) =>
    fetchApi("/auth/login", {
      method: "POST",
      body: credentials,
    }),

 
  register: (payload) =>
    fetchApi("/auth/register", {
      method: "POST",
      body: payload,
    }),


  refresh: () =>
    fetchApi("/auth/refresh", {
      method: "POST",
    }),

 
  logout: () =>
    fetchApi("/auth/logout", {
      method: "POST",
    }),
};