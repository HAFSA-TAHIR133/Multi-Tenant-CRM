import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import DashboardHeader from '../components/DashboardHeader';
import OverviewCards from '../components/overviewCard';
import TenantsLineGraph from '../components/TenantsLineGraph';
import PieChart from '../components/pieChart';
import { Skeleton } from '../../../components/ui/skeleton';
import { Building2, Users, ShieldCheck, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const statsRes = await dashboardApi.getStats();
        const tenantsChartRes = await dashboardApi.getTenantsChart();
        const tenantStatusRes = await dashboardApi.getTenantStatusChart();

        const normalizedStats = statsRes?.data || statsRes || {};
        const normalizedLine = tenantsChartRes?.data || tenantsChartRes?.items || tenantsChartRes || [];
        const normalizedStatus = tenantStatusRes?.data || tenantStatusRes?.items || tenantStatusRes || [];

        setStats(normalizedStats);
        setLineData(normalizedLine);
        setStatusData(normalizedStatus);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants ?? 0,
      description: 'All active and inactive tenants',
      icon: Building2,
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      description: 'Users across all tenants',
      icon: Users,
    },
    {
      title: 'Active Tenants',
      value: stats?.activeTenants ?? 0,
      description: 'Tenants currently active',
      icon: ShieldCheck,
    },
    {
      title: 'System Activity',
      value: stats?.activityCount ?? 0,
      description: 'Recent admin events',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Superadmin Dashboard"
        subtitle="Overview of tenants, users, and system activity."
      />

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <OverviewCards cards={cards} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex">
              <TenantsLineGraph
                title="Tenants Overview"
                valueLabel="New Tenants"
                data={lineData}
                xKey="day"
                yKey="tenants"
                dropdownOptions={['This Week', 'Last 7 Days', 'Last 14 Days']}
              />
            </div>

            <div className="lg:col-span-1 flex">
              <PieChart
                title="Tenants Status"
                data={statusData}
                valueLabel="tenants"
                centerLabel="Total"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}