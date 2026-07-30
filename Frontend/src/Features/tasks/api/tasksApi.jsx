import { fetchApi } from '../../../api/fetchApiHelper';
export const tasksApi = {
  getTasks: (params) =>
    fetchApi("/tasks", { params }),

  getTaskById: (id) => fetchApi(`/tasks/${id}`),

  createTask: (data) =>
    fetchApi("/tasks", {
      method: "POST",
      body: data,
    }),

  updateTask: (id, data) =>
    fetchApi(`/tasks/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteTask: (id) =>
    fetchApi(`/tasks/${id}`, {
      method: "DELETE",
    }),

  updateTaskStage: (id, stageId) =>
    fetchApi(`/tasks/${id}/stage`, {
      method: "PATCH",
      body: {
        stageId: Number(stageId),
      },
    }),
  getTasksForUser: (userId) => fetchApi(`/tasks?userId=${userId}`),
};