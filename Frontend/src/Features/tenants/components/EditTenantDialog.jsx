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
import { Switch } from '@/components/ui/switch'; // Assuming you have shadcn switch

export default function EditTenantDialog({ tenant, onUpdate, open, onOpenChange }) {
  // Separate state for basic info
  const [form, setForm] = useState({ name: '', slug: '', domain: '' });
  
  // Separate state for settings UI
  const [settingsUI, setSettingsUI] = useState({
    primaryColor: '#3b82f6',
    maxUsers: '100',
    enableNotifications: true,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name || '',
        slug: tenant.slug || '',
        domain: tenant.domain || '',
      });

      // Safely extract settings to show in the UI
      const dbSettings = tenant.settings || {};
      setSettingsUI({
        primaryColor: dbSettings.primaryColor || '#3b82f6',
        maxUsers: dbSettings.maxUsers?.toString() || '100',
        enableNotifications: dbSettings.enableNotifications ?? true,
      });
    }
  }, [tenant]);

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
        // Convert the UI fields back into a JSON object for the database!
        settings: {
          primaryColor: settingsUI.primaryColor,
          maxUsers: parseInt(settingsUI.maxUsers, 10) || 100,
          enableNotifications: settingsUI.enableNotifications,
        },
      };
      
      await onUpdate(tenant.id, payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- BASIC INFO SECTION --- */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" value={form.name} onChange={handleFormChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input id="edit-slug" name="slug" value={form.slug} onChange={handleFormChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-domain">Domain</Label>
              <Input id="edit-domain" name="domain" value={form.domain} onChange={handleFormChange} placeholder="e.g. app.theircompany.com" />
            </div>
          </div>

          {/* --- SETTINGS SECTION (Replaces the ugly JSON box) --- */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tenant Settings</h3>

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
              {loading ? 'Updating...' : 'Update Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}