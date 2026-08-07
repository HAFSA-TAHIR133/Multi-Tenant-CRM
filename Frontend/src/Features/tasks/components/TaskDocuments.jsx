import React, { useState, useEffect, useRef } from "react";
import { documentsApi } from "../api/documentsApi";
import { 
  FiChevronUp, 
  FiChevronDown,  
  FiUploadCloud, 
  FiFileText, 
  FiExternalLink 
} from "react-icons/fi";

export const TaskDocuments = ({ taskId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      loadDocuments();
    }
  }, [taskId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getDocumentsForTask(taskId);
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const newDoc = await documentsApi.uploadDocumentForTask(taskId, file);
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="task-section border-b border-gray-100 py-4">
      {/* Collapsible Section Header (Matches Task Information) */}
      <div
        className="flex items-center justify-between cursor-pointer py-1 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-[#5c6b82]">
            Task Documents
          </h3>
          {documents.length > 0 && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {documents.length}
            </span>
          )}
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          {isExpanded ? (
            <FiChevronUp className="w-5 h-5" />
          ) : (
            <FiChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Hidden Native File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${taskId}`}
          />

          {/* Upload Button */}
          <label
            htmlFor={`file-upload-${taskId}`}
            className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <FiUploadCloud className="w-4 h-4 text-slate-500" />
            <span>{uploading ? "Uploading attachment..." : "Attach File"}</span>
          </label>

          {/* Document List */}
          {loading ? (
            <p className="text-xs text-slate-400 py-2">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-1 italic">
              No documents attached yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-md border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FiFileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {doc.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="View / Download"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};