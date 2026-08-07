import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../../api/fetchApiHelper";
import { tasksApi } from "../api/tasksApi";
import TaskTable from "../columns/TaskTable";
import TaskCommentsDrawer from "../components/TaskCommentsDrawer";
import AddTaskDialog from "../components/AddTaskDialog";
import TaskEditDialog from "../components/TaskEditDialog";
import TaskDeleteDialog from "../components/TaskDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/Features/auth/context/AuthContext";
import { ROLES } from "@/constants/roles";

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const auth = getAuthUser();
  const currentUser = user || auth?.user || auth;
  const currentRole = currentUser?.role;
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;
  const isAdminOrSuperAdmin = currentRole === ROLES.ADMIN || currentRole === ROLES.SUPER_ADMIN;
  const isRegularUser = currentRole === ROLES.USER;

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Dialog & Drawer states
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [commentTask, setCommentTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Users & Leads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [usersRes, leadsRes] = await Promise.all([
          isAdminOrSuperAdmin ? fetchApi("/user") : Promise.resolve([]),
          fetchApi("/leads"),
        ]);
        if (!cancelled) {
          setUsers(Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []);
          setLeads(Array.isArray(leadsRes?.data) ? leadsRes.data : Array.isArray(leadsRes) ? leadsRes : []);
        }
      } catch (err) {
        console.error("Failed to load initial metadata:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminOrSuperAdmin]);

  // Fetch all tasks
  const loadTasks = async () => {
    setLoading(true);
    try {
      const res =
        isRegularUser && currentUserId
          ? await tasksApi.getTasksForUser(currentUserId)
          : await tasksApi.getTasks({});
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setTasks(list);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [isRegularUser, currentUserId]);

  // Task Filtering Strategy
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      const isCompleted = task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "done";
      const isOverdue = task.dueDate && new Date(task.dueDate) < now && !isCompleted;
      if (activeTab === "completed") return isCompleted;
      if (activeTab === "overdue") return isOverdue;
      return !isCompleted && !isOverdue; // "pending"
    });
  }, [tasks, searchQuery, activeTab]);

  // Status Counts
  const counts = useMemo(() => {
    const now = new Date();
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    tasks.forEach((task) => {
      const isDone = task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "done";
      if (isDone) {
        completed++;
      } else if (task.dueDate && new Date(task.dueDate) < now) {
        overdue++;
      } else {
        pending++;
      }
    });
    return { completed, pending, overdue };
  }, [tasks]);

  // Task Actions
  const handleCreateTask = async (payload) => {
    setFormLoading(true);
    try {
      const res = await tasksApi.createTask(payload);
      const created = res?.data || res;
      if (created) setTasks((prev) => [created, ...prev]);
      setAddOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTask = async (id, payload) => {
    try {
      const res = await tasksApi.updateTask(id, payload);
      const updated = res?.data || res;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));

      // Keep active drawer task object updated with new changes
      if (commentTask?.id === id) {
        setCommentTask((prev) => (prev ? { ...prev, ...updated } : null));
      }
      if (editTask?.id === id) setEditTask(null);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (id) => {
    setFormLoading(true);
    try {
      await tasksApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (commentTask?.id === id) setCommentTask(null);
      setDeleteTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50/50 dark:bg-transparent">
      {/* Main Table Layout View */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Task Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isAdminOrSuperAdmin
                ? "Overview and real-time management of organizational tasks."
                : "Track, organize, and reply to your assigned work."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            {isAdminOrSuperAdmin && (
              <Button onClick={() => setAddOpen(true)} className="h-9">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Status Navigation Tabs Row */}
        <div className="w-full border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center gap-6 overflow-x-auto w-full">
            {[
              { id: "completed", label: "Completed Tasks", count: counts.completed, icon: CheckCircle2 },
              { id: "pending", label: "Pending Tasks", count: counts.pending, icon: Clock },
              { id: "overdue", label: "Overdue Tasks", count: counts.overdue, icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    inline-flex flex-row items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap cursor-pointer shrink-0 w-auto
                    ${
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`} />
                  <span className="inline-block">{tab.label}</span>
                  <span
                    className={`
                      ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold
                      ${isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}
                    `}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Table Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex-1 dark:bg-slate-900 dark:border-slate-800">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
              Loading tasks...
            </div>
          ) : (
            <TaskTable
              tasks={filteredTasks}
              users={users}
              onUpdateTask={handleUpdateTask}
              onOpenComments={(task) => setCommentTask(task)}
              activeCommentTaskId={commentTask?.id}
              showAssignedTo={!isRegularUser}
              isRegularUser={isRegularUser}
            />
          )}
        </div>
      </div>

      {/* Slide-over Comments Drawer Modal */}
      {commentTask && (
        <TaskCommentsDrawer
          task={commentTask}
          currentUser={currentUser}
          users={users}
          onClose={() => setCommentTask(null)}
          onUpdateTask={handleUpdateTask}
          onEditTask={isAdminOrSuperAdmin ? (task) => setEditTask(task) : null}
          onDeleteTask={isAdminOrSuperAdmin ? (task) => setDeleteTask(task) : null}
          isRegularUser={isRegularUser}
        />
      )}

      {/* Dialog Modals */}
      {isAdminOrSuperAdmin && (
        <>
          <AddTaskDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={handleCreateTask}
            users={users}
            leads={leads}
            loading={formLoading}
          />
          {editTask && (
            <TaskEditDialog
              open={!!editTask}
              onOpenChange={(open) => !open && setEditTask(null)}
              task={editTask}
              onSubmit={handleUpdateTask}
              users={users}
              leads={leads}
              loading={formLoading}
            />
          )}
          {deleteTask && (
            <TaskDeleteDialog
              open={!!deleteTask}
              onOpenChange={(open) => !open && setDeleteTask(null)}
              task={deleteTask}
              onDelete={handleDeleteTask}
              loading={formLoading}
            />
          )}
        </>
      )}
    </div>
  );
}