import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// 1. Add open and onOpenChange to props
export default function DeleteTenantDialog({ tenant, onDelete, open, onOpenChange }) {
  // 2. REMOVED: const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(tenant.id);
      // 3. REMOVED: setOpen(false); (Parent handles closing now)
    } finally {
      setLoading(false);
    }
  };

  return (
    // 4. REMOVED the outer fragment and trigger Button
    // 5. Pass open and onOpenChange to Dialog
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Tenant</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium">{tenant?.name}</span>?
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}