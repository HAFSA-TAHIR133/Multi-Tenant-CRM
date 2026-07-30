import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tasksApi } from "../api/tasksApi";
import TaskDetailsCard from "../components/TaskDetailsCard";
import TaskComments from "../components/TaskComments";
import TaskNotes from "../components/TaskNotes";
import TaskDocuments from "../components/TaskDocuments";
import ChatEditor from "../../chat/components/ChatEditor";
import { Button } from "@/components/ui/button";

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuthUser();
  const currentUser = auth?.user;
  const currentRole = currentUser?.role;

  const isAdminOrSuperAdmin = currentRole === 2 || currentRole === 3;
  // If your "assigned user" lives on lead: use task.lead.assignedUserId
  const isAssignedUser =
    task?.lead?.assignedUserId &&
    String(task.lead.assignedUserId) === String(currentUser?.id);

  const canViewChat = isAdminOrSuperAdmin || isAssignedUser;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await tasksApi.getTaskById(id);
        const data = res?.data || res;
        if (!cancelled) setTask(data);
      } catch {
        // handle error UI if needed
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="p-6">
        <Button onClick={() => navigate(-1)}>Back</Button>
        <p className="mt-4 text-sm text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button onClick={() => navigate(-1)}>Back</Button>

      <TaskDetailsCard task={task} />

      <div>
        <h2 className="mb-2 text-xl font-semibold">Notes</h2>
        <TaskNotes taskId={task.id} />
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Documents</h2>
        <TaskDocuments taskId={task.id} />
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Comments</h2>
        <TaskComments taskId={task.id} />
      </div>

      {canViewChat && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Chat</h2>
          <ChatEditor taskId={task.id} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
}