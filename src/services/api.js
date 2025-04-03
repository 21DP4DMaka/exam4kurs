// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization token to all requests if available
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getCurrentUser: () => apiClient.get('/auth/me')
};

// Question services
export const questionService = {
  getQuestions: (params) => apiClient.get('/questions', { params }),
  getQuestionById: (id) => apiClient.get(`/questions/${id}`),
  createQuestion: (questionData) => apiClient.post('/questions', questionData),
  updateQuestion: (id, questionData) => apiClient.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => apiClient.delete(`/questions/${id}`),
  reportQuestion: (id, data) => apiClient.post(`/questions/${id}/report`, data),
  
  // Function to get questions by user ID
  getUserQuestions: (userId) => apiClient.get(`/users/${userId}/questions`)
};

// Answer services
export const answerService = {
  createAnswer: (answerData) => apiClient.post('/answers', answerData),
  acceptAnswer: (id) => apiClient.patch(`/answers/${id}/accept`)
};

// Notification services
export const notificationService = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all')
};

// Tag services
export const tagService = {
  getTags: () => apiClient.get('/tags'),
  
  // Get user professional tags
  getUserProfessionalTags: (userId) => apiClient.get(`/users/${userId}/professional-tags`),
  
  // Get profile tags
  getProfileTags: (profileId) => apiClient.get(`/professional-profiles/${profileId}/tags`),
  
  // Tag application services
  getUserTagApplications: () => apiClient.get('/tag-applications/user'),
  getTagApplications: (params) => apiClient.get('/tag-applications', { params }),
  applyForTag: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    return apiClient.post('/tag-applications', formData, config);
  },
  reviewTagApplication: (id, reviewData) => 
    apiClient.put(`/tag-applications/${id}/review`, reviewData),
  getTagApplicationDocument: (id) => 
    `${API_URL}/tag-applications/${id}/document`
};

// User management services
export const userService = {
  getUsers: (params) => apiClient.get('/users/admin/users', { params }),
  banUser: (userId, data) => apiClient.post(`/users/${userId}/ban`, data),
  unbanUser: (userId) => apiClient.post(`/users/${userId}/unban`),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
  reportUser: (userId, data) => apiClient.post(`/users/${userId}/report`, data),
  
  // Functions for user profiles and reviews
  getUserById: (userId) => apiClient.get(`/users/${userId}`),
  getUserQuestions: (userId) => apiClient.get(`/users/${userId}/questions`),
  getUserAnswers: (userId) => apiClient.get(`/users/${userId}/answers`),
  getUserReviews: (userId) => apiClient.get(`/reviews/users/${userId}/reviews`),
  createUserReview: (userId, reviewData) => apiClient.post(`/reviews/users/${userId}/reviews`, reviewData),
  updateUserProfile: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };
    return apiClient.put('/users/profile', formData, config);
  }
};

// NEW: Question attachment services
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
    return `${API_URL}/attachments/${attachmentId}/download?token=${token}`;
  }
};

// NEW: Comments services for answer discussions
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

export default apiClient;