import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Eye, Pencil } from "lucide-react";

export default function TaskCard({ task, onEdit, onOpenDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Dynamic badge color based on priority
  const getPriorityBadge = (priority) => {
    const val = priority?.toLowerCase();
    if (val === "high") {
      return "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/20";
    }
    if (val === "low") {
      return "bg-muted text-muted-foreground hover:bg-muted/80 border-border/40";
    }
    return "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      <Card className="group relative border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
        <CardContent className="p-3.5 space-y-3">
          {/* Header & Title */}
          <div className="flex items-start justify-between gap-2">
            <h4
              className="text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(task);
              }}
            >
              {task.title}
            </h4>
          </div>

          {/* Metadata Grid (User & Due Date) */}
          {(task.assignedUser || task.dueDate) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground font-medium">
              {task.assignedUser && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground/70" />
                  <span className="truncate max-w-[120px]">
                    {task.assignedUser.name || "Unassigned"}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground/70" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Badges & Actions Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 rounded-md capitalize font-medium ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority || "Normal"}
              </Badge>

              {task.status && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 rounded-md font-medium capitalize bg-muted/80 text-muted-foreground"
                >
                  {task.status}
                </Badge>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(task);
                }}
                title="Edit Task"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails?.(task);
                }}
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}