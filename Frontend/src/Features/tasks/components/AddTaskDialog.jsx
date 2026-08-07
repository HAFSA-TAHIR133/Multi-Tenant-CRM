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
  });

  const [validationError, setValidationError] = useState("");

  const getLeadOwnerId = (targetLeadId, availableLeads) => {
    if (!targetLeadId) return "";

    const selectedLead = availableLeads.find(
      (l) => String(l.id ?? l._id) === String(targetLeadId)
    );

    if (!selectedLead) return "";

    const rawOwnerId =
      selectedLead.assignedUserId ??
      selectedLead.assignedTo ??
      selectedLead.userId ??
      selectedLead.ownerId ??
      selectedLead.assignedUser?.id ??
      selectedLead.assignedUser?._id ??
      "";

    return rawOwnerId ? String(rawOwnerId) : "";
  };

  const getUserDisplayName = (u) => {
    if (!u) return "";
    if (u.name) return u.name;
    if (u.fullName) return u.fullName;
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.email || `User #${u.id || u._id}`;
  };

  const getLeadDisplayName = (l) => {
    if (!l) return "";
    return l.title || l.contactName || l.companyName || l.name || `Lead #${l.id || l._id}`;
  };

  useEffect(() => {
    if (open) {
      setValidationError("");

      const activeLead = pipelineLead || (leads && leads.length > 0 ? leads[0] : null);
      const initialLeadId = activeLead ? String(activeLead.id ?? activeLead._id ?? "") : "";
      const initialAssignedUser = getLeadOwnerId(initialLeadId, leads);

      setForm({
        title: "",
        description: "",
        priority: "normal",
        dueDate: "",
        assignedUserId: initialAssignedUser,
        leadId: initialLeadId,
      });
    }
  }, [open, pipelineLead, leads]);

  const handleLeadChange = (e) => {
    const selectedId = e.target.value;
    const associatedUserId = getLeadOwnerId(selectedId, leads);

    setForm((prevForm) => ({
      ...prevForm,
      leadId: selectedId,
      assignedUserId: associatedUserId,
    }));
  };

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
            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <NoteEditor
                value={form.description}
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                placeholder="Write task details..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Associated Lead <span className="text-destructive">*</span>
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  value={form.leadId}
                  onChange={handleLeadChange}
                  required
                >
                  <option value="" disabled>
                    Select a lead
                  </option>
                  {leads.map((l) => {
                    const lId = String(l.id ?? l._id);
                    return (
                      <option key={lId} value={lId}>
                        {getLeadDisplayName(l)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Lead Assigned Owner</Label>
                <select
                  disabled
                  className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed disabled:opacity-80"
                  value={form.assignedUserId}
                >
                  <option value="">No owner assigned to lead</option>
                  {users.map((u) => {
                    const uId = String(u.id ?? u._id);
                    return (
                      <option key={uId} value={uId}>
                        {getUserDisplayName(u)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
          </div>

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