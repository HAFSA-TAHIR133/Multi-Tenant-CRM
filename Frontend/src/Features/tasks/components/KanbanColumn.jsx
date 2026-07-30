import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function KanbanColumn({
  stage,
  tasks = [],
  onEditTask,
  onOpenDetails,
}) {
  // Makes empty columns droppable target areas
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-muted/30 border border-border/60 rounded-xl p-3 shadow-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color || "var(--primary)" }}
          />
          <h3 className="font-semibold text-sm tracking-tight text-foreground">
            {stage.name}
          </h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Drop Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[300px] transition-colors rounded-lg flex flex-col gap-2.5 ${
          isOver ? "bg-accent/40 ring-2 ring-primary/20" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg p-6">
            <p className="text-xs text-muted-foreground text-center">
              Drop tasks here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}