import { useEffect, useState, useRef } from "react";
import {
  X,
  Send,
  MessageSquare,
  Check,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import DOMPurify from "dompurify";
import { notesApi } from "../api/notesApi";
import { documentsApi } from "../api/documentsApi";
// React FilePond Imports
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
// shadcn UI AlertDialog
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

// Register FilePond Plugins
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

  // Documents State
  const [showDocuments, setShowDocuments] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);

  // Document Delete Confirmation Dialog State
  const [docToDelete, setDocToDelete] = useState(null);

  // FilePond state & refs
  const [pondFiles, setPondFiles] = useState([]);
  const pondRef = useRef(null);
  const fileInputRef = useRef(null);

  // Track active upload abort controllers (keyed by file.name)
  const activeControllersRef = useRef(new Map());

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const scrollRef = useRef(null);

  const isCompleted =
    task?.status?.toLowerCase() === "completed" ||
    task?.status?.toLowerCase() === "done";

  // Fetch comments
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

  // Fetch documents
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
        const hydratedNote = {
          ...created,
          creator: created.creator || created.user || currentUser,
        };
        setNotes((prev) => [...prev, hydratedNote]);
      }
      setCommentText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaperclipClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNativeFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPondFiles(files);
    }
    e.target.value = "";
  };

  // FilePond Process logic (abort/cancel wired properly)
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

    // Track controller by file name
    activeControllersRef.current.set(fileName, controller);

    // Initialize progress (0 → 100)
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
          // Clear FilePond selection after a short delay
          setTimeout(() => setPondFiles([]), 600);
        }
      })
      .catch((err) => {
        activeControllersRef.current.delete(fileName);
        if (
          err.name === "CanceledError" ||
          err.name === "AbortError" ||
          err.code === "ERR_CANCELED"
        ) {
          // Upload was cancelled
          abort();
        } else {
          console.error("FilePond upload failed:", err);
          error("Upload failed");
        }
      });

    // Provide abort handler to FilePond (built-in cancel)
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
    if (fileName && activeControllersRef.current.has(fileName)) {
      const controller = activeControllersRef.current.get(fileName);
      controller.abort();
      activeControllersRef.current.delete(fileName);
    }
    // Clear FilePond selection when user removes the file
    setPondFiles([]);
  };

  // Custom small cross button over the upload box
  const handleCustomUploadCancel = () => {
    // Abort all active controllers
    activeControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    activeControllersRef.current.clear();

    // Clear FilePond files
    setPondFiles([]);

    // If we want to also clear internal FilePond items, do it defensively
    if (pondRef.current) {
      try {
        pondRef.current.removeFiles && pondRef.current.removeFiles();
      } catch {
        // ignore
      }
    }
  };

  const confirmDeleteDocument = async (e) => {
    if (e) e.preventDefault();
    if (!docToDelete || !task?.id) return;

    const docId = docToDelete.id || docToDelete._id;
    setDeletingDocId(docId);

    try {
      await documentsApi.deleteTaskDocument(task.id, docId);
      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== docId));
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
    onUpdateTask(task.id, { status: isCompleted ? "pending" : "completed" });
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
    if (!task) return { name: "Unassigned", avatar: null };
    const foundUser = users.find(
      (u) =>
        String(u.id || u._id) ===
        String(
          task.assignedUserId || task.assignedTo || task.assignedUser?.id
        )
    );
    if (foundUser) {
      const profile = foundUser.profile;
      const fullName = profile?.firstName
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : "";
      return {
        name:
          fullName || foundUser.name || foundUser.email || "Assigned User",
        avatar:
          profile?.avatar || foundUser.avatarUrl || foundUser.avatar,
      };
    }
    return { name: "Unassigned", avatar: null };
  };

  const { name: assignedName, avatar: assignedAvatar } = getAssignedUserInfo();

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200/70 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
      case "medium":
      case "normal":
        return "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <>
      <style>{`
        .filepond--action-process-item {
          background-color: rgba(16, 185, 129, 0.15) !important;
        }
        .filepond--file-action-button {
          cursor: pointer !important;
        }
        .filepond--progress-indicator svg {
          stroke: #10b981 !important;
        }
        .filepond--file-status {
          color: #10b981 !important;
        }
      `}</style>

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        className="hidden"
      />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[2px] animate-in fade-in duration-200">
        <div className="flex-1 cursor-pointer" onClick={onClose} />

        {/* Drawer panel */}
        <div className="w-full max-w-md h-full flex flex-col bg-white shadow-2xl border-l border-slate-200/80 animate-in slide-in-from-right duration-300 dark:bg-slate-950 dark:border-slate-800">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Task
                </p>
                <h2
                  className={`font-semibold text-[15px] leading-snug line-clamp-2 ${
                    isCompleted
                      ? "line-through text-slate-400"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {task?.title || `Task #${task?.id}`}
                </h2>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {onUpdateTask && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 rounded-lg ${
                      isCompleted
                        ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }`}
                    onClick={toggleTaskCompletion}
                    title={isCompleted ? "Mark as pending" : "Mark as completed"}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {onEditTask && !isRegularUser && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    onClick={() => onEditTask(task)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDeleteTask && !isRegularUser && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      onDeleteTask(task);
                      onClose();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <span>Task Information</span>
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showDetails && (
              <div className="px-5 pb-4 space-y-3">
                {task?.description && (
                  <div
                    className="text-[12px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(task.description),
                    }}
                  />
                )}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-2.5 space-y-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 block">
                      Priority
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${getPriorityBadgeClass(
                        task?.priority
                      )}`}
                    >
                      {task?.priority || "Low"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-2.5 space-y-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 block">
                      Assigned
                    </span>
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar className="h-5 w-5 shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                        <AvatarImage src={assignedAvatar} />
                        <AvatarFallback className="text-[8px] bg-indigo-50 text-indigo-600 font-bold dark:bg-indigo-950/40">
                          <UserIcon className="h-2.5 w-2.5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                        {assignedName}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-2.5 space-y-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 block">
                      Due Date
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      <CalendarIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {task?.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "No date"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Task Documents */}
          <div className="border-b border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="w-full px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 text-indigo-500" />
                <span>Documents</span>
                {documents.length > 0 && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold tabular-nums">
                    {documents.length}
                  </span>
                )}
              </div>
              {showDocuments ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showDocuments && (
              <div className="px-5 pb-3.5 space-y-2">
                {docsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-[11px] text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading files...
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1.5">
                    No documents attached yet.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 scrollbar-thin">
                    {documents.map((doc) => {
                      const docId = doc.id || doc._id;
                      const isImageOrPdf =
                        /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i.test(
                          doc.name || doc.url
                        );
                      const isDeleting = deletingDocId === docId;
                      return (
                        <div
                          key={docId || Math.random()}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all group"
                        >
                          <div
                            onClick={() => handleDocumentClick(doc)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] text-slate-700 dark:text-slate-200 font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {doc.name}
                              </p>
                              {isImageOrPdf && (
                                <span className="text-[9px] text-indigo-500 font-medium">
                                  Previewable
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                            {isImageOrPdf && (
                              <button
                                onClick={() => handleDocumentClick(doc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                title="Preview Document"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                documentsApi.downloadDocument(doc.url, doc.name)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              title="Download Document"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDocToDelete(doc)}
                              disabled={isRegularUser || isDeleting}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isRegularUser
                                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              }`}
                              title={
                                isRegularUser
                                  ? "Only admins can delete documents"
                                  : "Delete Document"
                              }
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Feed */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/30 dark:bg-slate-950"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <p className="text-[11px] text-slate-400">Loading comments...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  No comments yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Start the conversation below.
                </p>
              </div>
            ) : (
              notes.map((note) => {
                const creator =
                  note.creator || note.user || note.author || currentUser;
                const profile = creator?.profile;
                const fullName =
                  `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
                const authorName =
                  fullName ||
                  creator?.name ||
                  creator?.email?.split("@")[0] ||
                  "User";
                const authorRole = getRoleLabel(creator?.role);
                return (
                  <div
                    key={note.id || note._id || Math.random()}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                      <AvatarImage
                        src={profile?.avatar || creator?.avatarUrl}
                      />
                      <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-bold dark:bg-indigo-950/50">
                        {getInitials(authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {authorName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-400 shrink-0">
                            {authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                          {note.createdAt
                            ? new Date(note.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-md border border-slate-100 dark:border-slate-800 leading-relaxed shadow-sm">
                        {note.content || note.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active FilePond Upload Box + custom cancel cross */}
          {pondFiles.length > 0 && (
            <div className="px-4 pt-3 pb-1 bg-indigo-50/40 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/30 relative">
              {/* Custom small cross on top-right of upload area */}
              <button
                type="button"
                onClick={handleCustomUploadCancel}
                className="absolute -top-2 right-3 h-5 w-5 flex items-center justify-center rounded-full bg-white text-slate-900 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
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

          {/* Footer input */}
          <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="flex gap-2 items-end">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl border-slate-200 dark:border-slate-700 transition-all text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                onClick={handlePaperclipClick}
                title="Select File from Device"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex flex-1 gap-2 items-end">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[40px] max-h-[100px] h-10 py-2.5 px-3 text-[12px] bg-slate-50 dark:bg-slate-900 resize-none border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 rounded-xl flex-1"
                />
                <Button
                  size="sm"
                  className="h-10 px-3.5 rounded-xl text-[12px] gap-1.5 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                  onClick={handlePostComment}
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Post</span>
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDoc}
        onDownload={documentsApi.downloadDocument}
      />

      {/* Delete Document Confirmation Dialog */}
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
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {docToDelete?.name}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!deletingDocId}
              className="rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              disabled={!!deletingDocId}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {deletingDocId ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}