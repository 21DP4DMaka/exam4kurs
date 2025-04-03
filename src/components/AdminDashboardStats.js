// src/components/AdminDashboardStats.js
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
        // Make a real API call to fetch statistics from your backend
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

  return (
    <div className="admin-statistics-dashboard">
      <h2 className="stats-title">Platformas statistika</h2>
      
      <div className="stats-grid">
        <div className="stats-card">
          <h3>Lietotāju statistika</h3>
          <div className="stats-card-content">
            <div className="stat-summary">
              <div className="stat-item">
                <div className="stat-value">{statistics.userStats.totalUsers}</div>
                <div className="stat-label">Kopā lietotāji</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.userStats.powerUsers}</div>
                <div className="stat-label">Profesionāļi</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.userStats.regularUsers}</div>
                <div className="stat-label">Parasti lietotāji</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.userStats.newUsersLastWeek}</div>
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
                      style={{ width: `${(statistics.userStats.powerUsers / statistics.userStats.totalUsers) * 100}%` }}
                    >
                      {statistics.userStats.powerUsers} ({((statistics.userStats.powerUsers / statistics.userStats.totalUsers) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                
                <div className="role-bar-container">
                  <div className="role-label">Lietotāji</div>
                  <div className="role-bar-wrapper">
                    <div 
                      className="role-bar regular"
                      style={{ width: `${(statistics.userStats.regularUsers / statistics.userStats.totalUsers) * 100}%` }}
                    >
                      {statistics.userStats.regularUsers} ({((statistics.userStats.regularUsers / statistics.userStats.totalUsers) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                
                <div className="role-bar-container">
                  <div className="role-label">Administratori</div>
                  <div className="role-bar-wrapper">
                    <div 
                      className="role-bar admin"
                      style={{ width: `${(statistics.userStats.adminUsers / statistics.userStats.totalUsers) * 100}%` }}
                    >
                      {statistics.userStats.adminUsers} ({((statistics.userStats.adminUsers / statistics.userStats.totalUsers) * 100).toFixed(1)}%)
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
                <div className="stat-value">{statistics.questionStats.totalQuestions}</div>
                <div className="stat-label">Kopā jautājumi</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.questionStats.answeredQuestions}</div>
                <div className="stat-label">Atbildēti</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.questionStats.openQuestions}</div>
                <div className="stat-label">Atvērti</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{statistics.questionStats.closedQuestions}</div>
                <div className="stat-label">Slēgti</div>
              </div>
            </div>
            
            <div className="question-status-distribution">
              <h4>Jautājumu statusa sadalījums</h4>
              <div className="status-pie-chart">
                <div className="status-pie-container">
                  <div className="status-pie">
                    <div 
                      className="status-slice answered" 
                      style={{ 
                        transform: `rotate(0deg)`,
                        clipPath: `polygon(50% 50%, 100% 0%, 100% 100%, 50% 50%)`,
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                    <div 
                      className="status-slice open" 
                      style={{ 
                        transform: `rotate(${(statistics.questionStats.answeredQuestions / statistics.questionStats.totalQuestions) * 360}deg)`,
                        clipPath: `polygon(50% 50%, 100% 0%, 100% 100%, 50% 50%)`,
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                    <div 
                      className="status-slice closed" 
                      style={{ 
                        transform: `rotate(${((statistics.questionStats.answeredQuestions + statistics.questionStats.openQuestions) / statistics.questionStats.totalQuestions) * 360}deg)`,
                        clipPath: `polygon(50% 50%, 100% 0%, 100% 100%, 50% 50%)`,
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="status-legend">
                  <div className="legend-item">
                    <div className="legend-color answered"></div>
                    <div className="legend-label">Atbildēti ({statistics.questionStats.answeredQuestions})</div>
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
            {statistics.tagStats.map((tag) => (
              <div className="bar-group" key={tag.id}>
                <div className="bar-label">{tag.name}</div>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${(tag.count / Math.max(...statistics.tagStats.map(t => t.count))) * 100}%` 
                    }}
                  >
                    {tag.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardStats;