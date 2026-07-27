import { Button } from '@/components/ui/button';

export default function TenantStatusToggle({ tenant, onToggle }) {
  return (
    <Button
      variant={tenant.status === 'active' ? 'destructive' : 'default'}
      size="sm"
      onClick={() => onToggle(tenant)}
    >
      {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
    </Button>
  );
}