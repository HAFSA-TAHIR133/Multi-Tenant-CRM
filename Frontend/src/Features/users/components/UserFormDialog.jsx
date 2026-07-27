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
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        status: user.status || 'active',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      status: form.status,
      ...(mode === 'create' ? { password: form.password } : {}),
      ...(mode === 'edit' && form.password ? { password: form.password } : {}),
    };
    await onSubmit(payload);
  };

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={mode === 'edit' ? 'Leave blank to keep current password' : ''}
            required={mode === 'create'}
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Input name="role" value={form.role} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Input name="status" value={form.status} onChange={handleChange} />
        </div>

        <DialogFooter>
          <Button type="submit">{mode === 'create' ? 'Create User' : 'Update User'}</Button>
        </DialogFooter>
      </form>
    </>
  );

  if (mode === 'create') {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
}