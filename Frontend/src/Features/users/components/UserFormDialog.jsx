import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserFormDialog({
  mode = 'create',
  user,
  open,
  onOpenChange,
  onSubmit,
  isAdmin = true, // Added isAdmin prop to toggle field permissions
}) {
  const [form, setForm] = useState({
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

  useEffect(() => {
    if (user && mode === 'edit') {
      setForm({
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
      setForm({
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
  }, [user, mode, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      email: form.email,
      role: Number(form.role),
      isActive: form.isActive,
      profile: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
      },
      ...(mode === 'create' ? { password: form.password } : {}),
      ...(mode === 'edit' && form.password ? { password: form.password } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {mode === 'create' ? 'Add User' : isAdmin ? 'Edit User' : 'Edit Profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Body */}
          <div className="space-y-4 px-6 overflow-y-auto flex-1 pb-4">
            
            {/* Editable for All - Required */}
            <div className="space-y-2">
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>

            {/* Editable for All - Required */}
            <div className="space-y-2">
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>

            {/* Password - Disabled for Regular Users */}
            <div className="space-y-2">
              <Label>
                Password{mode === 'create' && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  !isAdmin
                    ? 'Password managed by administrator'
                    : mode === 'edit'
                    ? 'Leave blank to keep current password'
                    : ''
                }
                required={mode === 'create'}
                disabled={!isAdmin}
              />
            </div>

            {/* Role - Disabled for Regular Users */}
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={!isAdmin}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="1">User</option>
                <option value="2">Admin</option>
                <option value="3">Super Admin</option>
              </select>
            </div>

            {/* Active Status - Disabled for Regular Users */}
            <div className="space-y-2 flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                disabled={!isAdmin}
                className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label htmlFor="isActive" className={!isAdmin ? 'opacity-50' : ''}>
                Active
              </Label>
            </div>

            {/* First Name & Last Name - Editable for All */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input name="firstName" value={form.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input name="lastName" value={form.lastName} onChange={handleChange} />
              </div>
            </div>

            {/* Phone - Editable for All */}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} />
            </div>

            {/* Designation - Disabled for Regular Users */}
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                disabled={!isAdmin}
              />
            </div>

            {/* Department - Disabled for Regular Users */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={!isAdmin}
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create User' : 'Update Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}