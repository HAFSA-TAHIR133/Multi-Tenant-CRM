import { useEffect, useState } from "react";
import { useAuth } from "@/Features/auth/context/AuthContext";
import DashboardHeader from "../components/DashboardHeader";
import OverviewCards from "../components/overviewCard";
import TenantsLineGraph from "../components/TenantsLineGraph";
import PieChart from "../components/pieChart";
import { dashboardApi } from "@/Features/dashboard/api/dashboardApi";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, ListTodo, AlertCircle } from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [statsRes, lineRes, statusRes] = await Promise.all([
          dashboardApi.getUserStats(),
          dashboardApi.getUserLineChart(),
          dashboardApi.getUserStatusChart(),
        ]);

        if (!cancelled) {
          const normalizedStats = statsRes?.data || statsRes || {};
          const normalizedLine =
            lineRes?.data || lineRes?.items || lineRes || [];
          const normalizedStatus =
            statusRes?.data || statusRes?.items || statusRes || [];

          setStats(normalizedStats);
          setLineData(normalizedLine);
          setStatusData(normalizedStatus);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load user dashboard data:", err);
          setError(err.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = [
    {
      title: "Assigned Tasks",
      value: stats?.assignedTasks ?? 0,
      description: "Total tasks assigned to you",
      icon: ListTodo,
    },
    {
      title: "Completed Tasks",
      value: stats?.completedTasks ?? 0,
      description: "Tasks you have completed",
      icon: CheckCircle2,
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks ?? 0,
      description: "Tasks awaiting action",
      icon: Clock,
    },
    {
      title: "Overdue Tasks",
      value: stats?.overdueTasks ?? 0,
      description: "Tasks past due date",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="My Dashboard"
        subtitle="Overview of your assigned tasks, completion rate, and progress."
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-80 w-full rounded-xl" />
            <Skeleton className="lg:col-span-1 h-80 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <OverviewCards cards={cards} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex">
              <TenantsLineGraph
                title="Tasks Over Time"
                valueLabel="Tasks"
                data={lineData}
                xKey="day"
                yKey="tasks"
                dropdownOptions={["This Week", "Last 7 Days", "Last 14 Days"]}
              />
            </div>

            <div className="lg:col-span-1 flex">
              <PieChart
                title="Task Status"
                data={statusData}
                valueLabel="tasks"
                centerLabel="Total"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}