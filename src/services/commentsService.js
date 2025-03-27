// src/services/commentsService.js
import apiClient from './api';

export const commentsService = {
    // Get comments for an answer
    getComments: (answerId) => 
      apiClient.get(`/answers/${answerId}/comments`),
    
    // Create a new comment
    createComment: (commentData) => 
      apiClient.post('/comments', commentData),
    
    // Update a comment (only creator can update)
    updateComment: (commentId, updatedContent) => 
      apiClient.put(`/comments/${commentId}`, { content: updatedContent }),
    
    // Delete a comment (only creator or admin can delete)
    deleteComment: (commentId) => 
      apiClient.delete(`/comments/${commentId}`)
  };