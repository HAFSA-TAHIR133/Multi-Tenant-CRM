import { useState, useEffect } from "react";
import { chatApi } from "../../chat/api/chatApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TaskComments({ taskId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await chatApi.getCommentsForTask(taskId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!cancelled) setComments(list);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const handleSend = async () => {
    if (!text.trim() || !taskId) return;
    setLoading(true);
    try {
      const res = await chatApi.createCommentForTask(taskId, { text });
      const newComment = res?.data || res;
      setComments((prev) => [...prev, newComment]);
      setText("");
    } catch {
      // handle error UI if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <div className="font-medium">{c.user?.name || "User"}</div>
            <div className="text-muted-foreground">{c.text}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={loading || !text.trim()}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}