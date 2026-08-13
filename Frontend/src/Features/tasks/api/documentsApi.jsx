import { fetchApi } from "../../../api/fetchApiHelper";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const documentsApi = {
  // List documents for a task
  getDocumentsForTask: (taskId) => fetchApi(`/tasks/${taskId}/documents`),

  // Upload a document for a task
  uploadDocumentForTask: async (taskId, file, options = {}) => {
    const { signal, onUploadProgress } = options || {};

    const formData = new FormData();
    formData.append("file", file);

    let auth = null;
    try {
      auth = JSON.parse(localStorage.getItem("auth") || "null");
    } catch {
      auth = null;
    }

    const token = auth?.accessToken;
    const tenantId =
      auth?.activeTenant?.id ||
      auth?.activeTenantId ||
      auth?.tenant?.id;

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
    };

    // If we want progress, use XHR because fetch doesn't expose upload progress
    if (typeof onUploadProgress === "function") {
      const url = `${BASE_URL}/tasks/${taskId}/documents/upload`;

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.open("POST", url, true);
        xhr.withCredentials = true;

        // Set headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        // Abort support
        if (signal) {
          if (signal.aborted) {
            xhr.abort();
            const abortError = new Error("Upload aborted");
            abortError.name = "AbortError";
            return reject(abortError);
          }
          signal.addEventListener("abort", () => {
            xhr.abort();
          });
        }

        // Progress callback
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onUploadProgress({
              loaded: event.loaded,
              total: event.total,
            });
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            let data = null;
            try {
              data = JSON.parse(xhr.responseText || "null");
            } catch {
              data = null;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data?.data || data);
            } else {
              const error = new Error(
                data?.message || data?.error || "Failed to upload document"
              );
              error.status = xhr.status;
              error.data = data;
              reject(error);
            }
          }
        };

        xhr.onerror = () => {
          const error = new Error("Network error while uploading document");
          reject(error);
        };

        xhr.onabort = () => {
          const error = new Error("Upload aborted");
          error.name = "AbortError";
          reject(error);
        };

        xhr.send(formData);
      });
    }

    // No progress requested → simple fetch with abort support
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/documents/upload`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
      signal,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const error = new Error(
        data?.message || data?.error || "Failed to upload document"
      );
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data?.data || data;
  },

  // Delete a document for a task
  deleteTaskDocument: (taskId, documentId) =>
    fetchApi(`/tasks/${taskId}/documents/${documentId}`, {
      method: "DELETE",
    }),

  // Helper function to trigger browser document downloads
  downloadDocument: async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "downloaded-file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download file:", err);
      // Fallback: open link directly in new tab
      window.open(fileUrl, "_blank");
    }
  },
};