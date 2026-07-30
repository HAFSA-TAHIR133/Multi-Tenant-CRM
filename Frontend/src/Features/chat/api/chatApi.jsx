import { fetchApi } from "../../../api/fetchApiHelper";

export const chatApi = {
  getCommentsForTask: (taskId) =>
    fetchApi(`/taskComments/${taskId}/comments`),

  createCommentForTask: (taskId, payload) =>
    fetchApi(`/taskComments/${taskId}/comments`, {
      method: "POST",
      body: payload, 
    }),
};