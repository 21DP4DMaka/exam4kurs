// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Axios instance с конфигурацией по умолчанию
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен авторизации ко всем запросам, если он доступен
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

// Auth сервисы
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getCurrentUser: () => apiClient.get('/auth/me')
};

// Сервисы вопросов
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

// Сервисы ответов
export const answerService = {
  createAnswer: (answerData) => apiClient.post('/answers', answerData),
  acceptAnswer: (id) => apiClient.patch(`/answers/${id}/accept`)
};

// Сервисы уведомлений
export const notificationService = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all')
};

// Сервисы тегов
export const tagService = {
  getTags: () => apiClient.get('/tags'),
  
  // Получить профессиональные теги пользователя
  getUserProfessionalTags: (userId) => apiClient.get(`/users/${userId}/professional-tags`),
  
  // Получить теги профессионального профиля
  getProfileTags: (profileId) => apiClient.get(`/professional-profiles/${profileId}/tags`),
  
  // Сервисы заявок на теги
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
  updateUserProfile: (profileData) => apiClient.put('/users/profile', profileData)
};