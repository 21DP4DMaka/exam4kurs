// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Axios instance ar noklusējuma konfigurāciju
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Pievieno autorizācijas token visiem pieprasījumiem, ja tas ir pieejams
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

// Auth servisi
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getCurrentUser: () => apiClient.get('/auth/me')
};

// Jautājumu servisi
export const questionService = {
  getQuestions: (params) => apiClient.get('/questions', { params }),
  getQuestionById: (id) => apiClient.get(`/questions/${id}`),
  createQuestion: (questionData) => apiClient.post('/questions', questionData),
  updateQuestion: (id, questionData) => apiClient.put(`/questions/${id}`, questionData)
};

// Atbilžu servisi
export const answerService = {
  createAnswer: (answerData) => apiClient.post('/answers', answerData),
  acceptAnswer: (id) => apiClient.patch(`/answers/${id}/accept`)
};

// Paziņojumu servisi
export const notificationService = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`)
};

// Tagu servisi
export const tagService = {
  getTags: () => apiClient.get('/tags'),
  
  // Tagu pieteikumu servisi
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

// Lietotāju servisi
export const userService = {
  getUserProfile: (id) => apiClient.get(`/users/${id}`),
  updateProfile: (profileData) => apiClient.put('/users/profile', profileData)
};

export default {
  auth: authService,
  questions: questionService,
  answers: answerService,
  notifications: notificationService,
  tags: tagService,
  users: userService
};