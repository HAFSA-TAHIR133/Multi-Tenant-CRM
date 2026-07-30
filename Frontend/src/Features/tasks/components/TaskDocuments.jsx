import { useEffect, useState } from "react";
import { documentsApi } from "../api/documentsApi";
import { Button } from "@/components/ui/button";

export default function TaskDocuments({ taskId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await documentsApi.getDocumentsForTask(taskId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!cancelled) setDocuments(list);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load documents");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    setUploading(true);
    setError("");
    try {
      const newDoc = await documentsApi.uploadDocumentForTask(taskId, file);
      setDocuments((prev) => [...prev, newDoc]);
      // Reset file input
      e.target.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {doc.name || doc.url}
              </a>
              <span className="text-xs text-muted-foreground">
                Uploaded by user #{doc.createdBy}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Upload document</label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-xs"
        />
        {uploading && (
          <span className="text-xs text-muted-foreground">Uploading...</span>
        )}
      </div>
    </div>
  );
}