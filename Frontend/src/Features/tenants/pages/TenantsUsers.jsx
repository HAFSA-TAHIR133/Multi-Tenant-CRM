import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersApi } from '../../users/api/usersApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import FormDialog from '@/components/common/FormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { userColumns } from '../../users/columns/userColumns';
import { Input } from '@/components/ui/input';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';

// Dynamic Zod Schema Generator
const getFormSchema = (isEdit = false) =>
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: isEdit
      ? z
          .string()
          .optional()
          .refine((val) => !val || val.length >= 6, {
            message: 'Password must be at least 6 characters if provided.',
          })
      : z.string().min(6, 'Password must be at least 6 characters.'),
    role: z.coerce.number(),
    isActive: z.boolean(),
  });

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

  // React Hook Form Configuration
  const form = useForm({
    resolver: zodResolver(getFormSchema(!!editUser)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 1,
      isActive: true,
    },
  });

  const normalizeUsers = (res) => {
    const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return raw.map((u) => (u?.dataValues ? u.dataValues : u));
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.getAllUsers();
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

  const handleOpenChange = (open) => {
    setFormOpen(open);
    if (!open) {
      setEditUser(null);
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 1,
        isActive: true,
      });
    }
  };

  const openCreateForm = () => {
    setEditUser(null);
    form.reset({
      name: '',
      email: '',
      password: '',
      role: 1,
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditUser(user);
    form.reset({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role ?? 1,
      isActive: user.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      const payload = {
        name: data.data ? data.data.name : data.name,
        email: data.data ? data.data.email : data.email,
        role: Number(data.role),
        isActive: data.isActive,
        ...(data.password ? { password: data.password } : {}),
      };

      if (editUser) {
        await usersApi.updateUser(editUser.id, payload);
      } else {
        await usersApi.createUser({
          ...payload,
          password: data.password,
          tenantId: tenantId,
        });
      }

      await loadUsers();
      handleOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await usersApi.deleteUser(deleteUser.id);
      await loadUsers();
      setDeleteUser(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await usersApi.updateUser(user.id, {
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
        onOpenChange={handleOpenChange}
        title={editUser ? 'Edit User' : 'Add User'}
        description={
          editUser? 'Update user details, credentials, or access permissions.'
            : 'Create a new user account for your tenant.'
        }
        submitLabel={editUser ? 'Update User' : 'Create User'}
        onSubmit={form.handleSubmit(handleFormSubmit)}
        loading={formLoading}
      >
        <FieldGroup className="space-y-4">
          {/* Name Field */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tenant-user-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="tenant-user-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Type Name"
                  autoComplete="off"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Email Field */}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tenant-user-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="tenant-user-email"
                  type="email"
                  aria-invalid={fieldState.invalid}
                  placeholder="email@example.com"
                  autoComplete="off"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Password Field */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tenant-user-password">
                  Password{!editUser ? ' *' : ''}
                </FieldLabel>
                <Input
                  {...field}
                  id="tenant-user-password"
                  type="password"
                  aria-invalid={fieldState.invalid}
                  placeholder={editUser ? 'Leave blank to keep current' : '••••••••'}
                  autoComplete="new-password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Role Select Field */}
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tenant-user-role">Role</FieldLabel>
                <select
                  {...field}
                  id="tenant-user-role"
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value={1}>User</option>
                  <option value={2}>Admin</option>
                  <option value={3}>Super Admin</option>
                </select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Status Select Field */}
          <Controller
            name="isActive"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tenant-user-status">Status</FieldLabel>
                <select
                  id="tenant-user-status"
                  value={String(field.value)}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="true">Active</option>
                  <option value="false">Deactivate</option>
                </select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
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