import React, { useState } from "react";
import { X, Download, ExternalLink, Loader2 } from "lucide-react";

export default function DocumentPreviewModal({ isOpen, onClose, document, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !document) return null;

  const { url, name } = document;
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name || url);
  const isPdf = /\.pdf$/i.test(name || url);

  const handleDownload = async () => {
    if (isDownloading || !onDownload) return;
    try {
      setIsDownloading(true);
      await onDownload(url, name);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
            {name || "Document Preview"}
          </h3>
          <div className="flex items-center gap-2">
            {/* Header Download Button with Green Loader */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                isDownloading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              title={isDownloading ? "Downloading..." : "Download File"}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-auto p-4">
          {isImage ? (
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-full object-contain rounded-md shadow-sm"
            />
          ) : isPdf ? (
            <iframe
              src={`${url}#toolbar=0`}
              title={name}
              className="w-full h-full rounded-md border-0"
            />
          ) : (
            <div className="text-center p-8 text-slate-500">
              <p className="text-sm">Preview is not available for this file type.</p>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="mt-3 inline-flex items-center gap-2 text-xs text-indigo-600 hover:underline font-medium disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" /> Download file instead
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}