'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

// Dynamic Zod Schema generation based on mode and admin status
const createUserSchema = (mode, isAdmin) =>
  z.object({
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Please enter a valid email address.'),
    password:
      mode === 'create'
        ? z.string().min(6, 'Password must be at least 6 characters.')
        : z.string().optional(),
    role: z.string(),
    isActive: z.boolean(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
  });

export default function UserFormDialog({
  mode = 'create',
  user,
  open,
  onOpenChange,
  onSubmit,
  isAdmin = true,
}) {
  const userSchema = React.useMemo(
    () => createUserSchema(mode, isAdmin),
    [mode, isAdmin]
  );

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '1',
      isActive: true,
      firstName: '',
      lastName: '',
      phone: '',
      designation: '',
      department: '',
    },
  });

  // Sync form values when modal opens or target user changes
  React.useEffect(() => {
    if (open) {
      if (user && mode === 'edit') {
        form.reset({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: String(user.role ?? '1'),
          isActive: user.isActive ?? true,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          designation: user.profile?.designation || '',
          department: user.profile?.department || '',
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: '1',
          isActive: true,
          firstName: '',
          lastName: '',
          phone: '',
          designation: '',
          department: '',
        });
      }
    }
  }, [user, mode, open, form]);

  const handleFormSubmit = async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      role: Number(data.role),
      isActive: data.isActive,
      profile: {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        designation: data.designation || '',
        department: data.department || '',
      },
      ...(mode === 'create' ? { password: data.password } : {}),
      ...(mode === 'edit' && data.password ? { password: data.password } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background text-foreground border-border">
        <DialogHeader className="px-6 pt-6 pb-0 space-y-0">
          <DialogTitle>
            {mode === 'create' ? 'Add User' : isAdmin ? 'Edit User' : 'Edit Profile'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === 'create'
              ? 'Create a new user account and set initial access permissions.'
              : isAdmin
              ? 'Update user account details, role assignments, and profile info.'
              : 'Update your personal profile information.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="user-form"
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col min-h-0 flex-1"
        >
          {/* Scrollable Body with compact spacing */}
          <div className="px-6 overflow-y-auto flex-1 pb-4">
            <FieldGroup className="gap-2.5">
              
              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="user-name">
                      Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-name"
                      placeholder="e.g. Jane Doe"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="user-email">
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-email"
                      type="email"
                      placeholder="jane@example.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="user-password">
                      Password
                      {mode === 'create' && (
                        <span className="text-destructive"> *</span>
                      )}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-password"
                      type="password"
                      placeholder={
                        !isAdmin
                          ? 'Password managed by administrator'
                          : mode === 'edit'
                          ? 'Leave blank to keep current password'
                          : '••••••••'
                      }
                      disabled={!isAdmin}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Role */}
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="user-role">Role</FieldLabel>
                    <select
                      {...field}
                      id="user-role"
                      disabled={!isAdmin}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900"
                    >
                      <option value="1">User</option>
                      <option value="2">Admin</option>
                      <option value="3">Super Admin</option>
                    </select>
                  </Field>
                )}
              />

              {/* Active Checkbox */}
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="flex items-center gap-2 py-1">
                    <input
                      id="user-isActive"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!isAdmin}
                      className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <FieldLabel
                      htmlFor="user-isActive"
                      className={`cursor-pointer ${!isAdmin ? 'opacity-50' : ''}`}
                    >
                      Active Account
                    </FieldLabel>
                  </Field>
                )}
              />

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="user-firstName">First Name</FieldLabel>
                      <Input id="user-firstName" placeholder="Jane" {...field} />
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="gap-1">
                      <FieldLabel htmlFor="user-lastName">Last Name</FieldLabel>
                      <Input id="user-lastName" placeholder="Doe" {...field} />
                    </Field>
                  )}
                />
              </div>

              {/* Phone */}
              <Controller
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="user-phone">Phone Number</FieldLabel>
                    <Input id="user-phone" placeholder="+1 (555) 000-0000" {...field} />
                  </Field>
                )}
              />

              {/* Designation */}
              <Controller
                name="designation"
                control={form.control}
                render={({ field }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="user-designation">Designation</FieldLabel>
                    <Input
                      id="user-designation"
                      placeholder="e.g. Software Engineer"
                      disabled={!isAdmin}
                      {...field}
                    />
                  </Field>
                )}
              />

              {/* Department */}
              <Controller
                name="department"
                control={form.control}
                render={({ field }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="user-department">Department</FieldLabel>
                    <Input
                      id="user-department"
                      placeholder="e.g. Product Engineering"
                      disabled={!isAdmin}
                      {...field}
                    />
                  </Field>
                )}
              />

            </FieldGroup>
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-3.5 mb-0.7 border-t bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="user-form">
              {mode === 'create' ? 'Create User' : 'Update Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}