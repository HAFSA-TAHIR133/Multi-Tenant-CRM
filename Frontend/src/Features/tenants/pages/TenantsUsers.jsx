import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '../../users/api/userApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import FormDialog from '@/components/common/FormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { userColumns } from '../../users/columns/userColumns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function TenantUsers() {
  const { tenantId } = useParams();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 1,
    isActive: true,
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 1,
      isActive: true,
    });
  };

  const normalizeUsers = (res) => {
    const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return raw.map((u) => (u?.dataValues ? u.dataValues : u));
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApi.getAllUsers();
      const normalized = normalizeUsers(res);
      setAllUsers(normalized);

      const filtered = normalized.filter(
        (u) => String(u.tenantId || u.tenant?.id || u.tenant_id) === String(tenantId)
      );

      if (filtered[0]?.tenant?.name) setTenantName(filtered[0].tenant.name);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const users = useMemo(() => {
    return allUsers.filter(
      (u) => String(u.tenantId || u.tenant?.id || u.tenant_id) === String(tenantId)
    );
  }, [allUsers, tenantId]);

  const filteredUsers = useMemo(() => {
    const q = globalFilter.toLowerCase().trim();
    if (!q) return users;

    return users.filter((user) =>
      `${user.name || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase().includes(q)
    );
  }, [users, globalFilter]);

  const openCreateForm = () => {
    resetForm();
    setEditUser(null);
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 1,
      isActive: user.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editUser) {
        await userApi.updateUser(editUser.id, payload);
      } else {
        await userApi.createUser({ ...payload, password: form.password });
      }

      await loadUsers();
      setFormOpen(false);
      resetForm();
      setEditUser(null);
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await userApi.deleteUser(deleteUser.id);
      await loadUsers();
      setDeleteUser(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userApi.updateUser(user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: !user.isActive,
      });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const columns = useMemo(
    () =>
      userColumns({
        onEdit: openEditForm,
        onDelete: setDeleteUser,
        onToggleStatus: handleToggleStatus,
        showActions: true,
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2">
          <Link to="/tenants" className="text-sm text-muted-foreground hover:underline">
            ← Back to Tenants
          </Link>
        </div>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {tenantName ? `Users - ${tenantName}` : 'Tenant Users'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage only the users of this tenant.
            </p>
          </div>

          <Button type="button" onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add User
          </Button>
        </div>
      </div>

      <TextInput
        placeholder="Search users..."
        leftSection={<IconSearch size={16} />}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.currentTarget.value)}
        className="max-w-sm"
      />

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            emptyMessage="No users found for this tenant."
            enableGlobalFilter={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            enablePagination={false}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditUser(null);
            resetForm();
          }
        }}
        title={editUser ? 'Edit User' : 'Add User'}
        submitLabel={editUser ? 'Update User' : 'Create User'}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password{!editUser ? ' *' : ''}</Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={editUser ? 'Leave blank to keep current' : ''}
              required={!editUser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: Number(e.target.value) }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={1}>User</option>
              <option value={2}>Admin</option>
              <option value={3}>Super Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <select
              id="isActive"
              name="isActive"
              value={String(form.isActive)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="true">Active</option>
              <option value="false">Deactivate</option>
            </select>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete"
        entityName={deleteUser?.name}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}