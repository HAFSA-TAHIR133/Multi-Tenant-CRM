import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
  Briefcase,
  Layers,
  ListTodo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import UserTasksTable from "../components/UserTasksTable";
import { useUsers } from "../hooks/useUsers";
import { usersApi } from "../api/usersApi";

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getUserById, user, loading } = useUsers();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const auth = getAuthUser();
  const currentUser = auth?.user;
  const currentRole = currentUser?.role;

  const isSelf = currentUser && String(user?.id) === String(currentUser.id);

  useEffect(() => {
    if (!user) return;

    setTasksLoading(true);
    usersApi
      .getTasksForUser(user.id)
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setTasks(list);
      })
      .catch((err) => {
        console.error("getTasksForUser error:", err);
        setTasks([]);
      })
      .finally(() => {
        setTasksLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!id) return;
    getUserById(id);
  }, [id, getUserById]);

  const canView =
    currentRole === 3 || // SUPERADMIN
    currentRole === 2 || // ADMIN
    isSelf;

  if (!id) return null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading user details...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">User not found.</p>
        </Card>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="p-6 text-center space-y-2 border-destructive/20">
          <h2 className="text-lg font-semibold text-destructive">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            You do not have permission to view this user profile.
          </p>
        </Card>
      </div>
    );
  }

  const profile = user.profile || {};

  const getRoleLabel = (role) => {
    if (role === 1) return "User";
    if (role === 2) return "Admin";
    if (role === 3) return "Super Admin";
    return "User";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/users")}
          className="text-muted-foreground hover:text-foreground -ml-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </Button>
      </div>

      {/* Header Profile Summary Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border border-primary/20 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {user.name || `${profile.firstName || ""} ${profile.lastName || ""}`.trim()}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Deactivated
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {user.email || "No email provided"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    {getRoleLabel(user.role)}
                  </span>
                  {user.tenantName && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Tenant: <strong className="text-foreground">{user.tenantName}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <Card className="md:col-span-1 border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted/60 text-muted-foreground">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Phone</p>
                <p className="font-medium text-foreground">{profile.phone || user.phone || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted/60 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Designation</p>
                <p className="font-medium text-foreground">{profile.designation || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted/60 text-muted-foreground">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Department</p>
                <p className="font-medium text-foreground">{profile.department || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <div className="md:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-primary" /> Assigned Tasks
              </CardTitle>
              <Badge variant="secondary" className="font-normal">
                {tasks.length} Total
              </Badge>
            </CardHeader>
            <CardContent>
              <UserTasksTable tasks={tasks} loading={tasksLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}