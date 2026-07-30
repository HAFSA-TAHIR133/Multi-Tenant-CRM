// src/Features/tasks/pages/Tasks.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../../api/fetchApiHelper";
import { tasksApi } from "../api/tasksApi";
import PipelineSelector from "../components/PipelineSelector";
import KanbanBoard from "../components/KanbanBoard";
import AddTaskDialog from "../components/AddTaskDialog";
import TaskEditDialog from "../components/TaskEditDialog";
import TaskDeleteDialog from "../components/TaskDeleteDialog";
import { Button } from "@/components/ui/button";
import { Plus, Users, User, Building2 } from "lucide-react";

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

export default function Tasks() {
  const navigate = useNavigate();
  const auth = getAuthUser();
  const currentRole = auth?.user?.role || auth?.role;

  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const isAdminOrSuperAdmin = currentRole === 2 || currentRole === 3;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi("/pipeline");
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!cancelled) setPipelines(list);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi("/user");
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!cancelled) setUsers(list);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPipelineId) {
      setStages([]);
      setLeads([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [stagesRes, leadsRes, tasksRes] = await Promise.all([
          fetchApi(`/pipeline/${selectedPipelineId}/stages`),
          fetchApi(`/pipeline/${selectedPipelineId}/leads`),
          tasksApi.getTasks({ pipelineId: selectedPipelineId }),
        ]);

        const stagesList = Array.isArray(stagesRes?.data)
          ? stagesRes.data
          : Array.isArray(stagesRes)
          ? stagesRes
          : [];

        const leadsList = Array.isArray(leadsRes?.data)
          ? leadsRes.data
          : Array.isArray(leadsRes)
          ? leadsRes
          : [];

        const tasksList = Array.isArray(tasksRes?.data)
          ? tasksRes.data
          : Array.isArray(tasksRes)
          ? tasksRes
          : [];

        if (!cancelled) {
          setStages(stagesList);
          setLeads(leadsList);
          setTasks(tasksList);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPipelineId]);

  const handleCreateTask = async (payload) => {
    setFormLoading(true);
    try {
      const res = await tasksApi.createTask(payload);
      const created = res?.data || res;
      if (created) {
        setTasks((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTask = async (id, payload) => {
    setFormLoading(true);
    try {
      const res = await tasksApi.updateTask(id, payload);
      const updated = res?.data || res;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      setEditTask(null);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    setFormLoading(true);
    try {
      await tasksApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setDeleteTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setFormLoading(false);
    }
  };

  // src/Features/tasks/pages/Tasks.jsx

const handleMoveTask = async (taskId, newStageId) => {
  const parsedStageId = Number(newStageId) || newStageId;

  // 1. Optimistic local state update
  setTasks((prev) =>
    prev.map((t) => (t.id === taskId ? { ...t, stageId: parsedStageId } : t))
  );

  try {
    // 2. Call dedicated endpoint
    const res = await tasksApi.updateTaskStage(taskId, parsedStageId);
    const updated = res?.data || res;

    if (updated) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    }
  } catch (err) {
    console.error("Failed to update stage:", err);
    // Rollback to server state if endpoint fails
    if (selectedPipelineId) {
      const tasksRes = await tasksApi.getTasks({ pipelineId: selectedPipelineId });
      const list = Array.isArray(tasksRes?.data) ? tasksRes.data : Array.isArray(tasksRes) ? tasksRes : [];
      setTasks(list);
    }
  }
};

  const handleOpenDetails = (task) => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage tasks across pipelines and stages.
          </p>
        </div>

        {isAdminOrSuperAdmin && (
          <Button onClick={() => setAddOpen(true)} disabled={!selectedPipelineId}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        )}
      </div>

      {/* Pipeline Selector Container */}
      <div className="space-y-3">
        <PipelineSelector
          value={selectedPipelineId}
          onChange={setSelectedPipelineId}
        />

        {/* Associated Leads Display */}
        {selectedPipelineId && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-card rounded-lg border border-border/60 shadow-sm mt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Associated Leads:</span>
            </div>

            {leads.length > 0 ? (
              leads.map((lead) => (
                <div
                  key={lead.id || lead._id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-foreground transition-all hover:bg-primary/15"
                >
                  <User className="h-3 w-3 text-primary" />
                  <span>{lead.name || lead.title || lead.leadName || "Unnamed Lead"}</span>
                  {lead.companyName && (
                    <span className="text-[10px] text-muted-foreground border-l border-border pl-1.5 flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5" />
                      {lead.companyName}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No leads currently assigned to this pipeline
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Board Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] border border-dashed rounded-xl bg-card/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading board & stages...</p>
        </div>
      ) : !selectedPipelineId ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-xl bg-card/50 p-8 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No Pipeline Selected</p>
          <p className="text-xs text-muted-foreground">Select a pipeline above to view tasks and stages.</p>
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          tasks={tasks}
          onEditTask={(task) => setEditTask(task)}
          onMoveTask={handleMoveTask}
          onOpenDetails={handleOpenDetails}
        />
      )}

      {isAdminOrSuperAdmin && (
        <AddTaskDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={handleCreateTask}
          stages={stages}
          users={users}
          leads={leads}
          loading={formLoading}
          defaultPipelineId={selectedPipelineId}
        />
      )}

      {editTask && (
        <TaskEditDialog
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          task={editTask}
          onSubmit={handleUpdateTask}
          stages={stages}
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
    </div>
  );
}