import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserDetailsCard({ user }) {
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name || '-'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="font-medium">Email:</span> {user.email || '-'}</p>
        <p>
          <span className="font-medium">Role:</span>{' '}
          {user.role === 1 ? 'User' : user.role === 2 ? 'Admin' : user.role === 3 ? 'Super Admin' : '-'}
        </p>
        <p>
          <span className="font-medium">Status:</span>{' '}
          {user.isActive ? 'Active' : 'Inactive'}
        </p>
        <p><span className="font-medium">Tenant:</span> {user.tenant?.name || '-'}</p>
      </CardContent>
    </Card>
  );
}