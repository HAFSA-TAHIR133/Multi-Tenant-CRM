import { useState, useEffect } from "react";
import { notesApi } from "../api/notesApi";
import { NoteEditor } from "./NoteEditor";
import { Button } from "@/components/ui/button";

export default function TaskNotes({ taskId }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await notesApi.getNotesForTask(taskId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const note = list[0] || null; // simple: use first note as main
        if (!cancelled) setContent(note?.content || "");
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load notes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const handleSave = async () => {
    if (!taskId) return;
    setSaving(true);
    setError("");
    try {
      await notesApi.createNote(taskId, { content });
    } catch (err) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading notes...</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <NoteEditor value={content} onChange={setContent} placeholder="Write notes..." />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}