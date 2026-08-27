import { useEffect, useState, useCallback } from 'react';
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
  const [timeframe, setTimeframe] = useState('This Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial stats and pie chart data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const statsRes = await dashboardApi.getStats();
        const tenantStatusRes = await dashboardApi.getTenantStatusChart();

        const normalizedStats = statsRes?.data || statsRes || {};
        const normalizedStatus = tenantStatusRes?.data || tenantStatusRes?.items || tenantStatusRes || [];

        setStats(normalizedStats);
        setStatusData(normalizedStatus);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch line graph data whenever timeframe changes
  const fetchLineGraph = useCallback(async (selectedTimeframe) => {
    try {
      const tenantsChartRes = await dashboardApi.getTenantsChart(selectedTimeframe);
      const normalizedLine = tenantsChartRes?.data || tenantsChartRes?.items || tenantsChartRes || [];
      setLineData(normalizedLine);
    } catch (err) {
      console.error('Failed to update line chart:', err);
    }
  }, []);

  useEffect(() => {
    fetchLineGraph(timeframe);
  }, [timeframe, fetchLineGraph]);

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
            <div className="flex lg:col-span-2">
              <TenantsLineGraph
                title="Tenants Overview"
                valueLabel="New Tenants"
                data={lineData}
                xKey="day"
                yKey="tenants"
                selectedTimeframe={timeframe}
                dropdownOptions={['This Week', 'Last 7 Days', 'Last 14 Days', 'Last 30 Days']}
                onTimeframeChange={(newTimeframe) => setTimeframe(newTimeframe)}
              />
            </div>

            <div className="flex lg:col-span-1">
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