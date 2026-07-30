// tasks/api/documentsApi.js
import { fetchApi } from "../../../api/fetchApiHelper";

const BASE_URL =import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const documentsApi = {
  // List documents for a task
  getDocumentsForTask: (taskId) => fetchApi(`/taskDocuments/${taskId}/documents`),

  // Upload a document for a task (uses native fetch + FormData)
  uploadDocumentForTask: async (taskId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    // Get auth and tenant from localStorage, same as fetchApi
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
      // DO NOT set Content-Type; browser sets it for FormData
    };

    const res = await fetch(`${BASE_URL}/taskDocuments/${taskId}/documents/upload`, {
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
      const error = new Error(
        data?.message || data?.error || "Failed to upload document"
      );
      error.status = res.status;
      error.data = data;
      throw error;
    }

    // httpResponse.CREATED wraps data under data.data
    return data?.data || data;
  },
};