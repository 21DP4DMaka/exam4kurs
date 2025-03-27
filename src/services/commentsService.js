import apiClient from './api';

export const commentsService = {
    // Get comments for an answer - Using the proper endpoint path
    getComments: (answerId) => {
      console.log(`Calling API to get comments for answerId: ${answerId}`);
      return apiClient.get(`/answers/${answerId}/comments`);
    },
    
    // Create a new comment
    createComment: (commentData) => {
      console.log(`Creating comment for answerId: ${commentData.answerId}, questionId: ${commentData.questionId}`);
      return apiClient.post('/comments', commentData);
    },
    
    // Update a comment (only creator can update)
    updateComment: (commentId, updatedContent) => {
      console.log(`Updating comment ID: ${commentId}`);
      return apiClient.put(`/comments/${commentId}`, { content: updatedContent });
    },
    
    // Delete a comment (only creator or admin can delete)
    deleteComment: (commentId) => {
      console.log(`Deleting comment ID: ${commentId}`);
      return apiClient.delete(`/comments/${commentId}`);
    }
  };
  
export default commentsService;