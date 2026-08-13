import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function FormDialog({
  open,
  onOpenChange,
  title = 'Form',
  description,
  onSubmit,
  children,
  submitLabel = 'Save',
  loading = false,
  size = 'default',
  formId = 'dialog-form',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          size === 'lg'
            ? 'sm:max-w-[600px] max-h-[90vh] overflow-y-auto'
            : 'sm:max-w-[500px] max-h-[90vh] overflow-y-auto'
        }
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {children}
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={loading}>
            {loading ? 'Saving...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}