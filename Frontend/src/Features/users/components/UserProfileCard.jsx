import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserProfileCard({ user }) {
  const profile = user?.profile;

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="font-medium">First Name:</span> {profile?.firstName || '-'}</p>
        <p><span className="font-medium">Last Name:</span> {profile?.lastName || '-'}</p>
        <p><span className="font-medium">Phone:</span> {profile?.phone || '-'}</p>
        <p><span className="font-medium">Designation:</span> {profile?.designation || '-'}</p>
        <p><span className="font-medium">Department:</span> {profile?.department || '-'}</p>
      </CardContent>
    </Card>
  );
}