import { useMemo, useState } from "react";
import DataTable from "../../../components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";

export default function TaskTable({
  tasks = [],
  users = [],
  onUpdateTask,
  onOpenComments,
  activeCommentTaskId,
  showAssignedTo = true,
  isRegularUser = false,
  loading = false,
}) {
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [titleValue, setTitleValue] = useState("");

  const handleTitleSubmit = (task) => {
    const taskId = task.id || task._id;
    if (titleValue.trim() && titleValue !== task.title) {
      onUpdateTask(taskId, { title: titleValue });
    }
    setEditingTitleId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Set Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60";
      case "medium":
      case "normal":
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60";
      case "low":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getAssignedUserInfo = (task) => {
    const assignedId = task.assignedUserId || task.assignedTo || task.assignedUser?.id || task.assignedTo?._id;
    const foundUser = users.find((u) => String(u.id || u._id) === String(assignedId));

    if (foundUser) {
      const profile = foundUser.profile;
      const fullName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "";
      return {
        name: fullName || foundUser.name || foundUser.fullName || foundUser.email || "Assigned User",
        avatar: profile?.avatar || foundUser.avatarUrl || foundUser.avatar,
      };
    }

    const taskUser = task.assignedUser || task.assignee || task.assignedToUser || task.assignedTo;
    if (taskUser && typeof taskUser === "object") {
      const profile = taskUser.profile;
      const fullName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "";
      return {
        name: fullName || taskUser.name || taskUser.fullName || taskUser.email || "Assigned User",
        avatar: profile?.avatar || taskUser.avatarUrl || taskUser.avatar,
      };
    }

    if (task.assignedUserName || task.assigneeName) {
      return {
        name: task.assignedUserName || task.assigneeName,
        avatar: null,
      };
    }

    return { name: "Unassigned", avatar: null };
  };

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: "title",
        header: "Task Name",
        size: 250,
        Cell: ({ row }) => {
          const task = row.original;
          const taskId = task.id || task._id;
          const isCompleted = task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "done";
          const isEditing = !isRegularUser && editingTitleId === taskId;

          return (
            <div className="flex items-center min-w-[200px]" onClick={(e) => isEditing && e.stopPropagation()}>
              {isEditing ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSubmit(task);
                      if (e.key === "Escape") setEditingTitleId(null);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 shrink-0"
                    onClick={() => handleTitleSubmit(task)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span
                  onDoubleClick={(e) => {
                    if (!isRegularUser) {
                      e.stopPropagation();
                      setEditingTitleId(taskId);
                      setTitleValue(task.title || "");
                    }
                  }}
                  className={`font-medium py-1 px-1 rounded-md inline-block max-w-full truncate ${
                    isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {task.title}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 130,
        Cell: ({ row }) => {
          const task = row.original;
          const taskId = task.id || task._id;
          return (
            <div onClick={(e) => e.stopPropagation()} className="min-w-[110px]">
              <Select
                disabled={isRegularUser}
                value={task.priority?.toLowerCase() || "low"}
                onValueChange={(val) => onUpdateTask(taskId, { priority: val })}
              >
                <SelectTrigger
                  className={`h-7 w-26 text-xs font-semibold capitalize border ${getPriorityBadgeClass(task.priority)} ${
                    isRegularUser ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high" className="text-red-600 font-medium">High</SelectItem>
                  <SelectItem value="medium" className="text-amber-600 font-medium">Medium</SelectItem>
                  <SelectItem value="low" className="text-slate-600 font-medium">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
    ];

    if (showAssignedTo) {
      cols.push({
        id: "assignedTo",
        header: "Assigned To",
        size: 160,
        Cell: ({ row }) => {
          const task = row.original;
          const { name, avatar } = getAssignedUserInfo(task);
          return (
            <div className="flex items-center gap-2 py-0.5 min-w-[140px]">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {name && name !== "Unassigned" ? (
                    name.slice(0, 2).toUpperCase()
                  ) : (
                    <UserIcon className="h-3 w-3" />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-slate-700 truncate max-w-[120px] dark:text-slate-300">
                {name}
              </span>
            </div>
          );
        },
      });
    }

    cols.push({
      accessorKey: "dueDate",
      header: "Due Date",
      size: 140,
      Cell: ({ row }) => {
        const task = row.original;
        const taskId = task.id || task._id;
        return (
          <div className="relative inline-flex items-center min-w-[120px]" onClick={(e) => e.stopPropagation()}>
            {!isRegularUser && (
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => onUpdateTask(taskId, { dueDate: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
            )}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-white dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800">
              <span>{formatDate(task.dueDate)}</span>
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        );
      },
    });

    return cols;
  }, [users, isRegularUser, showAssignedTo, editingTitleId, titleValue]);

  return (
    <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] rounded-md border border-slate-200 dark:border-slate-800">
      <div className="min-w-[650px] inline-block align-middle w-full">
        <DataTable
          columns={columns}
          data={tasks}
          loading={loading}
          emptyMessage="No tasks found."
          mantineTableProps={{
            highlightOnHover: true,
            withColumnBorders: false,
          }}
          mantineTableBodyRowProps={({ row }) => {
            const task = row.original;
            const taskId = task.id || task._id;
            const isSelected = activeCommentTaskId === taskId;

            return {
              onClick: () => onOpenComments(task),
              className: `cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                isSelected ? "bg-slate-100/70 dark:bg-slate-800/60" : ""
              }`,
            };
          }}
        />
      </div>
    </div>
  );
}