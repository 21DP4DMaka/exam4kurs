// src/services/questionAttachmentService.js
import apiClient from './api';

export const questionAttachmentService = {
  // Upload attachments for a question
  uploadAttachments: (questionId, formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    return apiClient.post(`/questions/${questionId}/attachments`, formData, config);
  },

  // Get all attachments for a question
  getAttachments: (questionId) => 
    apiClient.get(`/questions/${questionId}/attachments`),

  // Get a specific attachment
  getAttachment: (attachmentId) => 
    apiClient.get(`/attachments/${attachmentId}`),

  // Delete an attachment (only creator or admin can delete)
  deleteAttachment: (attachmentId) => 
    apiClient.delete(`/attachments/${attachmentId}`),
    
  // Download an attachment
  downloadAttachment: (attachmentId) => {
    const token = localStorage.getItem('token');
    return `${apiClient.defaults.baseURL}/attachments/${attachmentId}/download?token=${token}`;
  }
};