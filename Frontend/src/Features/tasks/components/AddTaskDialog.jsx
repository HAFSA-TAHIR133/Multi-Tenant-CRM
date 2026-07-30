// src/Features/tasks/components/AddTaskDialog.jsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoteEditor } from "./NoteEditor";

export default function AddTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  stages = [],
  users = [],
  leads = [],
  loading,
  defaultPipelineId,
  pipelineLead,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    dueDate: "",
    assignedUserId: "",
    leadId: "",
    stageId: "",
  });

  const [validationError, setValidationError] = useState("");

  // Reset form when dialog opens/closes or options change
  useEffect(() => {
    if (open) {
      setValidationError("");
      const initialLeadId = pipelineLead?.id ? String(pipelineLead.id) : (leads[0]?.id ? String(leads[0].id) : "");
      const initialStageId = stages[0]?.id ? String(stages[0].id) : "";

      setForm({
        title: "",
        description: "",
        priority: "normal",
        dueDate: "",
        assignedUserId: "",
        leadId: initialLeadId,
        stageId: initialStageId,
      });
    }
  }, [open, stages, leads, pipelineLead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const parsedLeadId = Number(form.leadId);
    if (!form.title.trim()) {
      setValidationError("Please enter a task title.");
      return;
    }
    if (!parsedLeadId || isNaN(parsedLeadId)) {
      setValidationError("Please select a valid associated lead.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      leadId: parsedLeadId,
      pipelineId: defaultPipelineId ? Number(defaultPipelineId) : undefined,
      stageId: form.stageId ? Number(form.stageId) : undefined,
      assignedUserId: form.assignedUserId ? Number(form.assignedUserId) : null,
    };

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden space-y-4">
          {validationError && (
            <div className="p-2.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {validationError}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-3">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <NoteEditor
                value={form.description}
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                placeholder="Write task details..."
              />
            </div>

            {/* Lead & Stage Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Stage</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.stageId}
                  onChange={(e) => setForm((f) => ({ ...f, stageId: e.target.value }))}
                >
                  <option value="">Default (First Stage)</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Assigned User */}
            <div className="space-y-2">
              <Label>Assigned User</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.assignedUserId}
                onChange={(e) =>{
                  console.log("Selected user ID:", e.target.value);
                  setForm((f) => ({ ...f, assignedUserId: e.target.value }))}}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}