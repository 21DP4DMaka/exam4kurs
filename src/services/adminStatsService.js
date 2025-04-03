// src/services/adminStatsService.js
import apiClient from './api';

// Service for fetching admin statistics
export const adminStatsService = {
  // Get all admin dashboard statistics
  getAdminStats: () => apiClient.get('/admin/statistics'),
  
  // Get user statistics only
  getUserStats: () => apiClient.get('/admin/statistics/users'),
  
  // Get question statistics only
  getQuestionStats: () => apiClient.get('/admin/statistics/questions'),
  
  // Get tag usage statistics
  getTagStats: () => apiClient.get('/admin/statistics/tags')
};

export default adminStatsService;