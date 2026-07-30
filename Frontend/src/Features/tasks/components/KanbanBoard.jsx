import { useMemo, useEffect, useState, useCallback } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";

export default function KanbanBoard({
  stages = [],
  tasks = [],
  onEditTask,
  onMoveTask,
  onOpenDetails,
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Get stage id for a given task id
  const getStageId = useCallback(
    (taskId) => {
      const task = localTasks.find((t) => String(t.id) === String(taskId));
      return task ? task.stageId : null;
    },
    [localTasks]
  );

  // Group tasks by stage
  const tasksByStage = useMemo(() => {
    const map = {};
    stages.forEach((s) => (map[s.id] = []));
    localTasks.forEach((t) => {
      if (!map[t.stageId]) map[t.stageId] = [];
      map[t.stageId].push(t);
    });
    return map;
  }, [stages, localTasks]);

  // Find which stage a droppable id belongs to
  const findStageForDroppable = useCallback(
    (droppableId) => {
      if (stages.some((s) => String(s.id) === String(droppableId))) {
        return droppableId;
      }
      const task = localTasks.find((t) => String(t.id) === String(droppableId));
      return task ? task.stageId : null;
    },
    [stages, localTasks]
  );

  const handleDragStart = (event) => {
    const task = localTasks.find((t) => String(t.id) === String(event.active.id));
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (String(activeId) === String(overId)) return;

      const activeStageId = getStageId(activeId);
      const overStageId = findStageForDroppable(overId);

      if (!activeStageId || !overStageId) return;

      if (String(activeStageId) !== String(overStageId)) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            String(t.id) === String(activeId)
              ? { ...t, stageId: Number(overStageId) || overStageId }
              : t
          )
        );
      } else {
        setLocalTasks((prev) => {
          const activeIndex = prev.findIndex((t) => String(t.id) === String(activeId));
          const overIndex = prev.findIndex((t) => String(t.id) === String(overId));
          if (activeIndex !== -1 && overIndex !== -1) {
            return arrayMove(prev, activeIndex, overIndex);
          }
          return prev;
        });
      }
    },
    [getStageId, findStageForDroppable]
  );


const handleDragEnd = async (event) => {
  const { active, over } = event;
  setActiveTask(null);

  if (!over) return;

  const taskId = active.id;
  const overId = over.id;
  const targetStageId = findStageForDroppable(overId);

  if (!targetStageId) return;

  // 1. Find the current task state in props/local state
  const originalTask = tasks.find((t) => String(t.id) === String(taskId));

  // 2. If the stage hasn't actually changed, stop early
  if (originalTask && String(originalTask.stageId) === String(targetStageId)) {
    return;
  }

  try {
    if (onMoveTask) {
      // 3. Delegate state update and API call to parent (Tasks.jsx)
      await onMoveTask(taskId, targetStageId);
    }
  } catch (error) {
    console.error("Failed to update task stage:", error);
    // Revert local optimistic UI on failure
    setLocalTasks(tasks);
  }
};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            tasks={tasksByStage[stage.id] || []}
            onEditTask={onEditTask}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}