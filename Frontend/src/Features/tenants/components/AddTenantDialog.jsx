import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';

export default function AddTenantDialog({ onCreate }) {
  const [open, setOpen] = useState(false);
  
  // Basic Info State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    domain: '',
    status: 'active',
  });

  // Settings UI State (Replaces raw JSON)
  const [settingsUI, setSettingsUI] = useState({
    primaryColor: '#3b82f6',
    maxUsers: '100',
    enableNotifications: true,
  });

  const [loading, setLoading] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsUI((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setSettingsUI((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        domain: form.domain.trim() || null,
        status: form.status,
        // Convert the UI fields into a JSON object automatically
        settings: {
          primaryColor: settingsUI.primaryColor,
          maxUsers: parseInt(settingsUI.maxUsers, 10) || 100,
          enableNotifications: settingsUI.enableNotifications,
        },
      };
      
      await onCreate(payload);
      
      // Reset forms after success
      setForm({ name: '', slug: '', domain: '', status: 'active' });
      setSettingsUI({
        primaryColor: '#3b82f6',
        maxUsers: '100',
        enableNotifications: true,
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add Tenant
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- BASIC INFO SECTION --- */}
            <div className="space-y-4 pb-4 border-b">              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleFormChange} placeholder="Company Name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={form.slug} onChange={handleFormChange} placeholder="company-name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" name="domain" value={form.domain} onChange={handleFormChange} placeholder="app.company.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {/* Changed to a select dropdown so they can't make typos */}
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Deactivate</option>
                </select>
              </div>
            </div>

            {/* --- SETTINGS SECTION --- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Default Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="setting-color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    id="setting-color" 
                    name="primaryColor" 
                    value={settingsUI.primaryColor} 
                    onChange={handleSettingsChange} 
                    className="h-10 w-14 p-1 cursor-pointer rounded border"
                  />
                  <Input 
                    name="primaryColor" 
                    value={settingsUI.primaryColor} 
                    onChange={handleSettingsChange} 
                    placeholder="#3b82f6" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setting-users">Max Users Limit</Label>
                <Input 
                  id="setting-users" 
                  name="maxUsers" 
                  type="number" 
                  value={settingsUI.maxUsers} 
                  onChange={handleSettingsChange} 
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="setting-notifications" className="cursor-pointer">Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Allow this tenant to receive system emails.</p>
                </div>
                <Switch 
                  id="setting-notifications"
                  checked={settingsUI.enableNotifications} 
                  onCheckedChange={(checked) => handleSwitchChange('enableNotifications', checked)} 
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}