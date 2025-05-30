import apiClient from './api';

export const commentsService = {
    // Get comments for an answer - Fixed URL to match server route
    getComments: (answerId) => {
      if (!answerId) {
        console.error('No answerId provided to getComments service');
        return Promise.reject(new Error('answerId is required'));
      }
      
      console.log(`Calling API to get comments for answerId: ${answerId}`);
      // The endpoint must match what's configured on the server
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
