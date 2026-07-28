import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../api/usersApi';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAllUsers();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : [];
      setUsers(list);
      return list;
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getUserById(id);
      setUser(res.data || null);
      return res.data || null;
    } catch (err) {
      setError(err.message || 'Failed to fetch user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getMe();
      setUser(res.data || null);
      return res.data || null;
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (payload) => {
    const res = await usersApi.createUser(payload);
    return res.data || res;
  }, []);

  const updateUser = useCallback(async (id, payload) => {
    const res = await usersApi.updateUser(id, payload);
    return res.data || res;
  }, []);

  const updateMe = useCallback(async (payload) => {
    const res = await usersApi.updateMe(payload);
    return res.data || res;
  }, []);

  const deleteUser = useCallback(async (id) => {
    const res = await usersApi.deleteUser(id);
    return res.data || res;
  }, []);

  return {
    users,
    user,
    loading,
    error,
    setUsers,
    setUser,
    getAllUsers,
    getUserById,
    getMe,
    createUser,
    updateUser,
    updateMe,
    deleteUser,
  };
}