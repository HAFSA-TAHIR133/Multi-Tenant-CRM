import { fetchApi } from '../../../api/fetchApiHelper';

export const userApi = {
  getAllUsers: () => fetchApi('/user'),
  getUserById: (id) => fetchApi(`/user/${id}`),
  createUser: (payload) =>
    fetchApi('/user', {
      method: 'POST',
      body: payload,
    }),
  updateUser: (id, payload) =>
    fetchApi(`/user/${id}`, {
      method: 'PUT',
      body: payload,
    }),
  deleteUser: (id) =>
    fetchApi(`/user/${id}`, {
      method: 'DELETE',
    }),
};