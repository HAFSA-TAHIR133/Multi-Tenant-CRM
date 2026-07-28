import { fetchApi } from '../../../api/fetchApiHelper';

export const usersApi = {
  getAllUsers: () => fetchApi('/user'),
  getUserById: (id) => fetchApi(`/user/${id}`),
  getMe: () => fetchApi('/user/me'),
  updateMe: (payload) =>fetchApi('/user/me', {
      method: 'PUT',
      body: payload,
    }),
  createUser: (payload) =>fetchApi('/user', {
      method: 'POST',
      body: payload,
    }),
  updateUser: (id, payload) =>fetchApi(`/user/${id}`, {
      method: 'PUT',
      body: payload,
    }),
  deleteUser: (id) =>fetchApi(`/user/${id}`, {
      method: 'DELETE',
    }),
  getTasksForUser: (userId) => fetchApi(`/tasks?userId=${userId}`),
};