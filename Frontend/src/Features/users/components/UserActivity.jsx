import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserActivity({ activities = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {activities.length ? (
          activities.map((item, index) => <p key={index}>{item}</p>)
        ) : (
          <p className="text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}