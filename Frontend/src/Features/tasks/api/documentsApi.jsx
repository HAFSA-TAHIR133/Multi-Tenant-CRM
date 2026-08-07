import { fetchApi } from "../../../api/fetchApiHelper";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const documentsApi = {
  // List documents for a task
  getDocumentsForTask: (taskId) => fetchApi(`/tasks/${taskId}/documents`),

  // Upload a document for a task
  uploadDocumentForTask: async (taskId, file) => {
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

    const res = await fetch(`${BASE_URL}/tasks/${taskId}/documents/upload`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const error = new Error(data?.message || data?.error || "Failed to upload document");
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