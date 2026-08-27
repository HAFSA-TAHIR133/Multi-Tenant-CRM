import React, { useState, useEffect, useRef } from 'react';
import { leadsApi } from '../api/leadsApi';
import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiExternalLink,
  FiLoader,
  FiDownload,
  FiChevronUp,
} from 'react-icons/fi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const isPreviewable = (nameOrUrl = '') =>
  /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(nameOrUrl);

export const LeadDocuments = ({ leadId, isRegularUser = false }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (leadId) loadDocuments();
  }, [leadId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.getDocuments(leadId);
      setDocuments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load lead documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !leadId) return;

    try {
      setUploading(true);
      const newDoc = await leadsApi.uploadDocument(leadId, file);
      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestDeleteDocument = (doc) => setDocToDelete(doc);

  const confirmDeleteDocument = async (e) => {
    e?.preventDefault();
    if (!leadId || !docToDelete) return;

    const docId = docToDelete.id || docToDelete._id;
    try {
      setDeletingId(docId);
      await leadsApi.deleteDocument(leadId, docId);
      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== docId));
      setDocToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreviewOrOpen = (doc) => {
    const name = doc.name || doc.filename || doc.originalName || '';
    const url = doc.url || doc.path;
    if (!url) return;

    if (isPreviewable(name) || isPreviewable(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      handleDownload(doc);
    }
  };

  const handleDownload = async (doc) => {
    const url = doc.url || doc.path;
    const fileName = doc.name || doc.filename || doc.originalName || 'downloaded-file';

    if (!url) return;

    try {
      const downloadUrl = url.includes('cloudinary.com')
        ? url.replace('/upload/', '/upload/fl_attachment/')
        : url;

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <div>
      {/* Header – matches screenshot */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <FiFileText className="w-4 h-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 m-0">
            Lead Documents
          </h3>
          {documents.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {documents.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-lead-${leadId}`}
          />
          <label
            htmlFor={`file-upload-lead-${leadId}`}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <FiLoader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FiUploadCloud className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading...' : 'Attach File'}
          </label>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <FiChevronUp
              className={`w-4 h-4 transition-transform ${expanded ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <FiLoader className="w-4 h-4 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <FiFileText className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
              <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                No documents attached yet.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 m-0">
                Click “Attach File” to upload.
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {documents.map((doc) => {
                const docId = doc.id || doc._id;
                const fileName =
                  doc.name || doc.filename || doc.originalName || 'Untitled Document';
                const canPreview = isPreviewable(fileName) || isPreviewable(doc.url);
                const isDeleting = deletingId === docId;

                return (
                  <div
                    key={docId}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Left: icon + name + status badge */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <FiFileText className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[280px]">
                          {fileName}
                        </span>

                        {canPreview ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            Previewable
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Download only
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Download"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>

                      <a
                        href={doc.url || doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Open in new tab"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </a>

                      {!isRegularUser && (
                        <button
                          type="button"
                          onClick={() => requestDeleteDocument(doc)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting ? (
                            <FiLoader className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!docToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDocToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {docToDelete?.name ||
                  docToDelete?.filename ||
                  docToDelete?.originalName ||
                  'this document'}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletingId !== null}
              className="rounded-xl disabled:opacity-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              disabled={deletingId !== null}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deletingId !== null ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};