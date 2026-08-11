import React, { useState, useEffect, useRef } from "react";
import { leadsApi } from "../api/leadsApi";
import {
  FiChevronUp,
  FiChevronDown,
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiExternalLink,
  FiLoader,
  FiDownload,
} from "react-icons/fi";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const isPreviewable = (nameOrUrl = "") =>
  /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(nameOrUrl);

export const LeadDocuments = ({ leadId, isRegularUser = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (leadId) {
      loadDocuments();
    }
  }, [leadId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.getDocuments(leadId);
      setDocuments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to load lead documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !leadId) return;

    try {
      setUploading(true);
      const newDoc = await leadsApi.uploadDocument(leadId, file);
      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const requestDeleteDocument = (doc) => {
    setDocToDelete(doc);
  };

  const confirmDeleteDocument = async () => {
    if (!leadId || !docToDelete) return;

    const docId = docToDelete.id || docToDelete._id;

    try {
      setDeletingId(docId);
      await leadsApi.deleteDocument(leadId, docId);
      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== docId));
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeletingId(null);
      setDocToDelete(null);
    }
  };

  // Preview images/PDFs in browser; download other types
  const handlePreviewOrOpen = (doc) => {
    const name = doc.name || doc.filename || doc.originalName || "";
    const url = doc.url || doc.path;
    if (!url) return;

    if (isPreviewable(name) || isPreviewable(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      handleDownload(doc);
    }
  };

  const handleDownload = async (doc) => {
    const url = doc.url || doc.path;
    const fileName =
      doc.name || doc.filename || doc.originalName || "downloaded-file";

    if (!url) return;

    try {
      const downloadUrl = url.includes("cloudinary.com")
        ? url.replace("/upload/", "/upload/fl_attachment/")
        : url;

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  return (
    <div className="lead-section">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer py-1 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Lead Documents
          </h3>
          {documents.length > 0 && (
            <span className="text-xs bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 px-2 py-0.5 rounded-full font-semibold">
              {documents.length}
            </span>
          )}
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
        >
          {isExpanded ? (
            <FiChevronUp className="w-5 h-5" />
          ) : (
            <FiChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-lead-${leadId}`}
          />

          <label
            htmlFor={`file-upload-lead-${leadId}`}
            className={`flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors cursor-pointer ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <FiLoader className="w-4 h-4 text-violet-500 animate-spin" />
            ) : (
              <FiUploadCloud className="w-4 h-4 text-violet-500" />
            )}
            <span className="font-medium">
              {uploading ? "Uploading attachment..." : "Attach File"}
            </span>
          </label>

          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
              <FiLoader className="w-3.5 h-3.5 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-1 italic">
              No documents attached yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {documents.map((doc) => {
                const docId = doc.id || doc._id;
                const fileName =
                  doc.name || doc.filename || doc.originalName || "Untitled Document";
                const canPreview = isPreviewable(fileName) || isPreviewable(doc.url);
                const isDeleting = deletingId === docId;

                return (
                  <div
                    key={docId || Math.random()}
                    className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:border-violet-200 dark:hover:border-violet-900/40 transition-all group"
                  >
                    <div
                      onClick={() => handlePreviewOrOpen(doc)}
                      className="flex items-center gap-2.5 min-w-0 pr-2 flex-1 cursor-pointer"
                      title={
                        canPreview
                          ? "Click to preview in browser"
                          : "Click to download"
                      }
                    >
                      <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                        <FiFileText className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate block group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {canPreview ? "Previewable" : "Download only"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        title="Download"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Open in new tab"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {!isRegularUser && (
                        <button
                          type="button"
                          onClick={() => requestDeleteDocument(doc)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <FiTrash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!docToDelete}
        onOpenChange={(open) => !open && setDocToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {docToDelete?.name ||
                  docToDelete?.filename ||
                  "this document"}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};