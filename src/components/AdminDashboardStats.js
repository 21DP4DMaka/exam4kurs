// src/components/AdminDashboardStats.js - исправлено отображение статистики
import React, { useState, useEffect } from 'react';
import { adminStatsService } from '../services/adminStatsService';
import './AdminDashboardStats.css';

const AdminDashboardStats = () => {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // Запрос статистики с бэкенда
        const response = await adminStatsService.getAdminStats();
        setStatistics(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again.');
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) return <div className="stats-loading">Ielāde...</div>;
  if (error) return <div className="stats-error">{error}</div>;
  if (!statistics) return null;

  // Проверяем, что необходимые данные существуют
  const { userStats = {}, questionStats = {}, tagStats = [] } = statistics;
  
  // Устанавливаем значения по умолчанию, чтобы избежать ошибок
  const totalUsers = userStats.totalUsers || 0;
  const powerUsers = userStats.powerUsers || 0;
  const regularUsers = userStats.regularUsers || 0;
  const adminUsers = userStats.adminUsers || 0;
  const newUsersLastWeek = userStats.newUsersLastWeek || 0;
  
  const totalQuestions = questionStats.totalQuestions || 0;
  const answeredQuestions = questionStats.answeredQuestions || 0;
  const openQuestions = questionStats.openQuestions || 0;
  const closedQuestions = questionStats.closedQuestions || 0;
  
  // Проверяем, что мы не делим на ноль
  const powerUsersPercent = totalUsers ? ((powerUsers / totalUsers) * 100).toFixed(1) : 0;
  const regularUsersPercent = totalUsers ? ((regularUsers / totalUsers) * 100).toFixed(1) : 0;
  const adminUsersPercent = totalUsers ? ((adminUsers / totalUsers) * 100).toFixed(1) : 0;
  
  // Рассчитываем максимальное значение для диаграммы тегов
  const maxTagCount = tagStats.length > 0 ? Math.max(...tagStats.map(t => t.count || 0)) : 1;

  return (
    <div className="admin-statistics-dashboard">
      <h2 className="stats-title">Platformas statistika</h2>
      
      <div className="stats-grid">
        <div className="stats-card">
          <h3>Lietotāju statistika</h3>
          <div className="stats-card-content">
            <div className="stat-summary">
              <div className="stat-item">
                <div className="stat-value">{totalUsers}</div>
                <div className="stat-label">Kopā lietotāji</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{powerUsers}</div>
                <div className="stat-label">Profesionāļi</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{regularUsers}</div>
                <div className="stat-label">Parasti lietotāji</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{newUsersLastWeek}</div>
                <div className="stat-label">Jauni lietotāji (nedēļā)</div>
              </div>
            </div>
            
            <div className="user-roles-distribution">
              <h4>Lietotāju lomu sadalījums</h4>
              <div className="role-bars">
                <div className="role-bar-container">
                  <div className="role-label">Profesionāļi</div>
                  <div className="role-bar-wrapper">
                    <div 
                      className="role-bar professional"
                      style={{ width: `${powerUsersPercent}%` }}
                    >
                      {powerUsers} ({powerUsersPercent}%)
                    </div>
                  </div>
                </div>
                
                <div className="role-bar-container">
                  <div className="role-label">Lietotāji</div>
                  <div className="role-bar-wrapper">
                    <div 
                      className="role-bar regular"
                      style={{ width: `${regularUsersPercent}%` }}
                    >
                      {regularUsers} ({regularUsersPercent}%)
                    </div>
                  </div>
                </div>
                
                <div className="role-bar-container">
                  <div className="role-label">Administratori</div>
                  <div className="role-bar-wrapper">
                    <div 
                      className="role-bar admin"
                      style={{ width: `${adminUsersPercent}%` }}
                    >
                      {adminUsers} ({adminUsersPercent}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <h3>Jautājumu statistika</h3>
          <div className="stats-card-content">
            <div className="stat-summary">
              <div className="stat-item">
                <div className="stat-value">{totalQuestions}</div>
                <div className="stat-label">Kopā jautājumi</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{answeredQuestions}</div>
                <div className="stat-label">Atbildēti</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{openQuestions}</div>
                <div className="stat-label">Atvērti</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{closedQuestions}</div>
                <div className="stat-label">Slēgti</div>
              </div>
            </div>
            
            <div className="question-status-distribution">
              <h4>Jautājumu statusa sadalījums</h4>
              <div className="status-pie-chart">
  <div className="status-pie-container">
    {/* Здесь нужно исправить отображение кругов статистики */}
    <div className="status-pie">
      {/* Расчет правильных пропорций для каждого сегмента */}
      <div 
        className="status-slice answered" 
        style={{ 
          clipPath: `polygon(50% 50%, 0% 0%, ${statistics.questionStats.answeredQuestions / statistics.questionStats.totalQuestions * 100}% 0%)`,
          transform: 'rotate(0deg)',
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div 
        className="status-slice open" 
        style={{ 
          clipPath: `polygon(50% 50%, ${statistics.questionStats.answeredQuestions / statistics.questionStats.totalQuestions * 100}% 0%, 100% ${statistics.questionStats.openQuestions / statistics.questionStats.totalQuestions * 100}%)`,
          transform: 'rotate(0deg)',
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div 
        className="status-slice closed" 
        style={{ 
          clipPath: `polygon(50% 50%, 100% ${statistics.questionStats.openQuestions / statistics.questionStats.totalQuestions * 100}%, 100% 100%, 0% 100%, 0% 0%)`,
          transform: 'rotate(0deg)',
          width: '100%',
          height: '100%'
        }}
      ></div>
    </div>
  </div>
  
  <div className="status-legend">
    <div className="legend-item">
      <div className="legend-color answered"></div>
      <div className="legend-label">Atbildēja ({statistics.questionStats.answeredQuestions})</div>
    </div>
    <div className="legend-item">
      <div className="legend-color open"></div>
      <div className="legend-label">Atvērti ({statistics.questionStats.openQuestions})</div>
    </div>
    <div className="legend-item">
      <div className="legend-color closed"></div>
      <div className="legend-label">Slēgti ({statistics.questionStats.closedQuestions})</div>
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stats-card full-width">
        <h3>Populārākās kategorijas (tagi)</h3>
        <div className="tag-stats-chart">
          <div className="bar-chart">
            {tagStats.map((tag) => (
              <div className="bar-group" key={tag.id}>
                <div className="bar-label">{tag.name}</div>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${((tag.count || 0) / maxTagCount) * 100}%` 
                    }}
                  >
                    {tag.count || 0}
                  </div>
                </div>
              </div>
            ))}
            {tagStats.length === 0 && (
              <div className="empty-state">Nav atrasti populārie tagi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardStats;