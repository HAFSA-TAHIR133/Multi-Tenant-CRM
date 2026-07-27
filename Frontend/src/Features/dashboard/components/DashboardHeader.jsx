export default function DashboardHeader({ title = 'Dashboard', subtitle }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}