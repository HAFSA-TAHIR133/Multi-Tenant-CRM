import { useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { leadsApi } from '../../leads/api/leadsApi';
import DashboardHeader from '../components/DashboardHeader';
import OverviewCards from '../components/overviewCard';
import TenantsLineGraph from '../components/TenantsLineGraph';
import PieChart from '../components/pieChart';
import { Skeleton } from '../../../components/ui/skeleton';
import { Users, FolderKanban, CheckCircle2, Clock3 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const statsRes = await dashboardApi.getAdminStats();
        const lineRes = await dashboardApi.getAdminLineChart();
        const leadsRes = await leadsApi.getAll();

        setStats(statsRes?.data || statsRes || {});
        setLineData(lineRes?.data || lineRes?.items || lineRes || []);

        // Normalize leads data
        const rawLeads = Array.isArray(leadsRes) ? leadsRes :
                         Array.isArray(leadsRes?.data) ? leadsRes.data :
                         Array.isArray(leadsRes?.items) ? leadsRes.items : [];
        setAllLeads(rawLeads);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Compute status distribution from all leads (including closed)
  const statusData = useMemo(() => {
    if (!allLeads.length) return [];

    const statusCounts = {};
    allLeads.forEach((lead) => {
      const status = (lead.status || 'unknown').toLowerCase().trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status === 'close' || status === 'closed' ? 'Closed' : status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      status,
    }));
  }, [allLeads]);

  const cards = [
    { title: 'Total Leads', value: stats?.totalLeads ?? 0, description: 'All leads in the system', icon: Users },
    { title: 'Active Pipelines', value: stats?.activePipelines ?? 0, description: 'Running pipelines', icon: FolderKanban },
    { title: 'Completed Tasks', value: stats?.completedTasks ?? 0, description: 'Tasks finished successfully', icon: CheckCircle2 },
    { title: 'Due Tasks', value: stats?.pendingTasks ?? 0, description: 'Tasks due soon or overdue', icon: Clock3 },
  ];

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Overview of leads, pipelines, and task activity."
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
                title="Pipeline Weekly Revenue"
                valueLabel="Revenue"
                data={lineData}
                xKey="day"
                yKey="revenue"
                isCurrency={true}
                dropdownOptions={['This Week', 'Last 7 Days', 'Last 14 Days']}
                />
            </div>
            <div className="lg:col-span-1 flex">
              <PieChart
                title="Lead Status"
                data={statusData}
                valueLabel="leads"
                centerLabel="Total"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}