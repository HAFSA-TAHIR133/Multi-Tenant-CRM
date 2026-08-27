import { useEffect, useState, useRef } from "react";
import {
  X,
  Send,
  MessageSquare,
  Check,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  Download,
  Eye,
  Loader2,
  Plus,
} from "lucide-react";
import DOMPurify from "dompurify";
import { notesApi } from "../api/notesApi";
import { documentsApi } from "../api/documentsApi";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import { Button } from "@/components/ui/button";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
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

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

export default function TaskCommentsDrawer({
  task,
  currentUser,
  users = [],
  onClose,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  isRegularUser = false,
}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [pondFiles, setPondFiles] = useState([]);
  const pondRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeControllersRef = useRef(new Map());
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const scrollRef = useRef(null);

  const isCompleted =
    task?.status?.toLowerCase() === "completed" ||
    task?.status?.toLowerCase() === "done";

  useEffect(() => {
    if (!task?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const res = await notesApi.getNotesForTask(task.id);
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        if (!cancelled) setNotes(list);
      } catch (err) {
        console.error("Failed to load task comments:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  useEffect(() => {
    if (!task?.id) return;

    let cancelled = false;

    (async () => {
      setDocsLoading(true);

      try {
        const res = await documentsApi.getDocumentsForTask(task.id);
        const docList = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        if (!cancelled) setDocuments(docList);
      } catch (err) {
        console.error("Failed to load task documents:", err);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handlePostComment = async () => {
    if (!commentText.trim() || submitting || !task?.id) return;

    setSubmitting(true);

    try {
      const payload = {
        taskId: Number(task.id),
        task: Number(task.id),
        content: commentText.trim(),
        text: commentText.trim(),
      };

      const res = await notesApi.createNote(task.id, payload);
      const created = res?.data || res;

      if (created) {
        setNotes((prev) => [
          ...prev,
          {
            ...created,
            creator: created.creator || created.user || currentUser,
          },
        ]);
      }

      setCommentText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleNativeFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      setPondFiles(files);
    }

    e.target.value = "";
  };

  const handlePondProcess = (
    fieldName,
    file,
    metadata,
    load,
    error,
    progress,
    abort
  ) => {
    if (!file || !task?.id) {
      error("Missing file or task ID");
      return;
    }

    const controller = new AbortController();
    const fileName = file.name;

    activeControllersRef.current.set(fileName, controller);
    progress(true, 0, 100);

    documentsApi
      .uploadDocumentForTask(task.id, file, {
        signal: controller.signal,
        onUploadProgress: (e) => {
          if (e.total && e.total > 0) {
            progress(true, e.loaded, e.total);
          }
        },
      })
      .then((newDoc) => {
        activeControllersRef.current.delete(fileName);

        if (newDoc) {
          setDocuments((prev) => [newDoc, ...prev]);
          load(newDoc.id || newDoc._id || "uploaded");

          setTimeout(() => {
            setPondFiles([]);
          }, 600);
        }
      })
      .catch((err) => {
        activeControllersRef.current.delete(fileName);

        if (
          err.name === "CanceledError" ||
          err.name === "AbortError" ||
          err.code === "ERR_CANCELED"
        ) {
          abort();
        } else {
          console.error("FilePond upload failed:", err);
          error("Upload failed");
        }
      });

    return {
      abort: () => {
        controller.abort();
        activeControllersRef.current.delete(fileName);
        abort();
      },
    };
  };

  const handleFileRemove = (error, fileItem) => {
    const fileName = fileItem?.file?.name;

    if (
      fileName &&
      activeControllersRef.current.has(fileName)
    ) {
      activeControllersRef.current.get(fileName).abort();
      activeControllersRef.current.delete(fileName);
    }

    setPondFiles([]);
  };

  const handleCustomUploadCancel = () => {
    activeControllersRef.current.forEach((controller) => {
      controller.abort();
    });

    activeControllersRef.current.clear();
    setPondFiles([]);

    try {
      pondRef.current?.removeFiles?.();
    } catch {}
  };

  const confirmDeleteDocument = async (e) => {
    if (e) e.preventDefault();

    if (!docToDelete || !task?.id) return;

    const docId = docToDelete.id || docToDelete._id;
    setDeletingDocId(docId);

    try {
      await documentsApi.deleteTaskDocument(task.id, docId);

      setDocuments((prev) =>
        prev.filter((doc) => (doc.id || doc._id) !== docId)
      );

      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleDocumentClick = (doc) => {
    const isImageOrPdf = /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(
      doc.name || doc.url
    );

    if (isImageOrPdf) {
      setPreviewDoc(doc);
      setIsPreviewOpen(true);
    } else {
      documentsApi.downloadDocument(doc.url, doc.name);
    }
  };

  const toggleTaskCompletion = () => {
    if (!onUpdateTask || !task?.id) return;

    onUpdateTask(task.id, {
      status: isCompleted ? "pending" : "completed",
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "U";

    const parts = nameStr.trim().split(" ");

    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : nameStr.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    if (role === 2 || role === "ADMIN") return "Admin";
    if (role === 1 || role === "USER") return "User";
    if (role === 3 || role === "SUPER_ADMIN") return "Super Admin";

    return "Member";
  };

  const getAssignedUserInfo = () => {
    if (!task) {
      return {
        name: "Unassigned",
        avatar: null,
      };
    }

    const foundUser = users.find(
      (user) =>
        String(user.id || user._id) ===
        String(
          task.assignedUserId ||
            task.assignedTo ||
            task.assignedUser?.id
        )
    );

    if (foundUser) {
      const profile = foundUser.profile;

      const fullName = profile?.firstName
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : "";

      return {
        name:
          fullName ||
          foundUser.name ||
          foundUser.email ||
          "Assigned User",
        avatar:
          profile?.avatar ||
          foundUser.avatarUrl ||
          foundUser.avatar,
      };
    }

    return {
      name: "Unassigned",
      avatar: null,
    };
  };

  const {
    name: assignedName,
    avatar: assignedAvatar,
  } = getAssignedUserInfo();

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-600 border-red-100";

      case "medium":
      case "normal":
        return "bg-amber-50 text-amber-700 border-amber-100";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDueDate = (date) => {
    if (!date) return "No date";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <style>{`
        .filepond--action-process-item {
          background-color: rgba(100, 116, 139, 0.12) !important;
        }

        .filepond--file-action-button {
          cursor: pointer !important;
        }

        .filepond--progress-indicator svg {
          stroke: #64748b !important;
        }

        .filepond--file-status {
          color: #64748b !important;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        className="hidden"
      />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-200">
        <div className="flex-1 cursor-pointer" onClick={onClose} />

        {/* Drawer */}
        <div className="w-full max-w-[420px] h-full flex flex-col bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 pt-4 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
            {/* Top row: Task badge + actions */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M2 4h12M2 8h12M2 12h8"
                    strokeLinecap="round"
                  />
                </svg>
                Task
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleTaskCompletion}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title={
                    isCompleted
                      ? "Mark as pending"
                      : "Mark as completed"
                  }
                  aria-label={
                    isCompleted
                      ? "Mark task as pending"
                      : "Mark task as completed"
                  }
                >
                  <Check
                    className="h-4 w-4"
                    strokeWidth={2.5}
                  />
                </button>

                {onEditTask && !isRegularUser && (
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit task"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {onDeleteTask && !isRegularUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteTask(task);
                      onClose();
                    }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h2
              className={`text-[17px] font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-2.5 ${
                isCompleted ? "line-through text-slate-400" : ""
              }`}
            >
              {task?.title || `Task #${task?.id}`}
            </h2>

            {/* Status + Due */}
            <div className="flex items-center gap-2.5 text-[13px]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />

                {isCompleted ? "Completed" : "Pending"}
              </span>

              <span className="text-slate-400">·</span>

              <span className="text-slate-500 dark:text-slate-400">
                Due {formatDueDate(task?.dueDate)}
              </span>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide"
          >
            {/* Task Information */}
            <div className="border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-5 py-3 flex items-center justify-between text-[13px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
              >
                <span>Task Information</span>

                {showDetails ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {showDetails && (
                <div className="px-5 pb-4 space-y-3">
                  {task?.description ? (
                    <div
                      className="text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          task.description
                        ),
                      }}
                    />
                  ) : (
                    <div className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800" />
                  )}

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Priority */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 m-0">
                        Priority
                      </p>

                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium border capitalize ${getPriorityBadgeClass(
                          task?.priority
                        )}`}
                      >
                        {task?.priority || "Low"}
                      </span>
                    </div>

                    {/* Assigned */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 m-0">
                        Assigned
                      </p>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                          {getInitials(assignedName)}
                        </div>

                        <span className="text-[12px] font-medium text-slate-800 dark:text-slate-100 truncate">
                          {assignedName}
                        </span>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 m-0">
                        Due Date
                      </p>

                      <div className="flex items-center gap-1 text-[12px] font-medium text-slate-800 dark:text-slate-100">
                        <CalendarIcon className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {formatDueDate(task?.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="px-5 py-3 flex items-center justify-between">
                <button
                  onClick={() =>
                    setShowDocuments(!showDocuments)
                  }
                  className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-600 transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5 text-slate-500" />

                  <span>Documents</span>

                  {documents.length > 0 && (
                    <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {documents.length}
                    </span>
                  )}

                  {showDocuments ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePaperclipClick}
                  className="h-7 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:!bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  
                >
                  <Plus className="h-3 w-3" />
                  Attach File
                </button>
              </div>

              {showDocuments && (
                <div className="px-5 pb-4 space-y-2">
                  {docsLoading ? (
                    <div className="flex items-center gap-2 py-3 text-[12px] text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading files...
                    </div>
                  ) : documents.length === 0 ? (
                    <p className="text-[12px] text-slate-400 italic py-2 m-0">
                      No documents attached yet.
                    </p>
                  ) : (
                    documents.map((doc) => {
                      const docId = doc.id || doc._id;

                      const isImageOrPdf =
                        /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(
                          doc.name || doc.url
                        );

                      const isDeleting = deletingDocId === docId;

                      return (
                        <div
                          key={docId}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                        >
                          <div
                            onClick={() =>
                              handleDocumentClick(doc)
                            }
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-500">
                              <FileText className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate m-0">
                                {doc.name}
                              </p>

                              {isImageOrPdf && (
                                <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                                  Previewable
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {isImageOrPdf && (
                              <button
                                onClick={() =>
                                  handleDocumentClick(doc)
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Preview"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                documentsApi.downloadDocument(
                                  doc.url,
                                  doc.name
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setDocToDelete(doc)}
                              disabled={
                                isRegularUser || isDeleting
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                isRegularUser
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              }`}
                              title={
                                isRegularUser
                                  ? "Only admins can delete"
                                  : "Delete"
                              }
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                <span>Comments</span>

                {notes.length > 0 && (
                  <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {notes.length}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-4 bg-slate-50/30 dark:bg-slate-950">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <p className="text-[12px] text-slate-400 m-0">
                    Loading comments...
                  </p>
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                  </div>

                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 m-0">
                    No comments yet
                  </p>

                  <p className="text-[12px] text-slate-400 mt-1 m-0">
                    Start the conversation below.
                  </p>
                </div>
              ) : (
                notes.map((note) => {
                  const creator =
                    note.creator ||
                    note.user ||
                    note.author ||
                    currentUser;

                  const profile = creator?.profile;

                  const fullName =
                    `${profile?.firstName || ""} ${
                      profile?.lastName || ""
                    }`.trim();

                  const authorName =
                    fullName ||
                    creator?.name ||
                    creator?.email?.split("@")[0] ||
                    "User";

                  const authorRole = getRoleLabel(creator?.role);

                  return (
                    <div
                      key={note.id || note._id}
                      className="flex gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        {getInitials(authorName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {authorName}
                            </span>

                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                              {authorRole}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                            {note.createdAt
                              ? new Date(
                                  note.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                        </div>

                        <div className="text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                          {note.content || note.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active FilePond upload */}
          {pondFiles.length > 0 && (
            <div className="px-4 pt-2.5 pb-1 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative shrink-0">
              <button
                type="button"
                onClick={handleCustomUploadCancel}
                className="absolute -top-2 right-3 h-5 w-5 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
                title="Cancel upload"
              >
                <X className="h-3 w-3" />
              </button>

              <FilePond
                ref={pondRef}
                files={pondFiles}
                onupdatefiles={setPondFiles}
                allowMultiple={false}
                maxFiles={1}
                allowProcess={true}
                allowRevert={true}
                instantUpload={true}
                server={{
                  process: handlePondProcess,
                }}
                onremovefile={handleFileRemove}
              />
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handlePaperclipClick}
                className="h-9 w-9 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <div className="flex flex-1 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-9 px-3.5 text-[13px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                />

                <Button
                  size="sm"
                  className="h-9 px-4 rounded-full text-[13px] gap-1.5 shrink-0 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white shadow-sm disabled:opacity-50"
                  onClick={handlePostComment}
                  disabled={
                    submitting || !commentText.trim()
                  }
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Post
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDoc}
        onDownload={documentsApi.downloadDocument}
      />

      <AlertDialog
        open={!!docToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingDocId) {
            setDocToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete document?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. This will permanently
              delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {docToDelete?.name}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!deletingDocId}
              className="rounded-xl disabled:opacity-50"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDeleteDocument}
              disabled={!!deletingDocId}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {deletingDocId ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}