import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import { authService, questionService, notificationService } from '../services/api';

function DashboardPage({ user: passedUser, setCurrentPage }) {
  const [user, setUser] = useState(passedUser || null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    unreadNotifications: 0
  });
  
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ielādēt lietotāja datus
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) {
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Kļūda ielādējot lietotāja datus:', error);
        setError('Neizdevās ielādēt lietotāja profilu. Lūdzu, pieslēdzieties vēlreiz.');
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Ielādēt jautājumus un paziņojumus, kad lietotājs ir ielādēts
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Ielādēt jautājumus
        const questionsResponse = await questionService.getQuestions({
          limit: 5,
          page: 1
        });
        
        setQuestions(questionsResponse.data.questions);
        
        // Ielādēt paziņojumus
        const notificationsResponse = await notificationService.getNotifications({
          limit: 5,
          page: 1
        });
        
        setNotifications(notificationsResponse.data.notifications);
        
        // Uzstādīt statistiku
        setStats({
          totalQuestions: questionsResponse.data.totalItems,
          answeredQuestions: questionsResponse.data.questions.filter(q => q.status === 'answered').length,
          pendingQuestions: questionsResponse.data.questions.filter(q => q.status === 'open').length,
          unreadNotifications: notificationsResponse.data.unreadCount
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Kļūda ielādējot instrumentu paneļa datus:', error);
        setError('Kļūda ielādējot datus. Lūdzu, atsvaidziniet lapu.');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const markNotificationAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      
      // Atjaunināt UI bez servera papildu pieprasījuma
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      
      // Atjaunināt nelasīto paziņojumu skaitu
      setStats(prevStats => ({
        ...prevStats,
        unreadNotifications: prevStats.unreadNotifications - 1
      }));
    } catch (error) {
      console.error('Kļūda atzīmējot paziņojumu kā lasītu:', error);
    }
  };
  
  const handleNavigateToProProfile = (e) => {
    e.preventDefault();
    setCurrentPage('professional-profile');
  };
  
  // Formatē datumu
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };
  
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('lv-LV')} ${date.toLocaleTimeString('lv-LV', {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (isLoading) return <div className="loading-spinner">Ielāde...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">Lietotājs nav atrasts. Lūdzu, pieslēdzieties vēlreiz.</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="user-profile">
            <div className="avatar">
              <img 
                src={user.profileImage || "https://via.placeholder.com/80"} 
                alt={`${user.username} profila attēls`} 
              />
            </div>
            <h3>{user.username}</h3>
            <p className="user-type">
              {user.role === 'admin' ? 'Administrators' : 
               user.role === 'power' ? 'Power lietotājs' : 'Lietotājs'}
            </p>
            
            {/* Pro Profils poga profesionāļiem */}
            {user && user.role === 'power' && (
              <button 
                className="btn btn-profils"
                onClick={handleNavigateToProProfile}
              >
                Pro Profils
              </button>
            )}
          </div>
          
          <nav className="dashboard-nav">
            <ul>
              <li className="active"><a href="#"><i className="icon">📊</i> Pārskats</a></li>
              <li><a href="#"><i className="icon">❓</i> Mani jautājumi</a></li>
              <li><a href="#"><i className="icon">✓</i> Manas atbildes</a></li>
              <li><a href="#"><i className="icon">🔔</i> Paziņojumi <span className="badge">{stats.unreadNotifications}</span></a></li>
              <li><a href="#"><i className="icon">⭐</i> Favorīti</a></li>
              
              {/* Administratora saite tagu pieteikumiem (tikai adminiem) */}
              {user && user.role === 'admin' && (
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage('admin-tag-applications');
                    }}
                  >
                    <i className="icon">📝</i> Tagu pieteikumi
                  </a>
                </li>
              )}
              
              <li><a href="#"><i className="icon">👤</i> Profila iestatījumi</a></li>
            </ul>
          </nav>
        </div>
        
        <div className="dashboard-content">
          <h2>Sveiki, {user.username}!</h2>
          <p className="welcome-message">Laipni lūgti savā Professional Answers panelī. Šeit varat pārvaldīt savus jautājumus un atbildes.</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalQuestions}</div>
              <div className="stat-label">Kopā jautājumi</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.answeredQuestions}</div>
              <div className="stat-label">Atbildēti</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pendingQuestions}</div>
              <div className="stat-label">Gaidoši</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.unreadNotifications}</div>
              <div className="stat-label">Nelasīti paziņojumi</div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card recent-questions">
              <div className="card-header">
                <h3>Jaunākie jautājumi</h3>
                <a href="#" className="view-all">Skatīt visus</a>
              </div>
              <div className="card-content">
                {questions.length === 0 ? (
                  <p className="empty-state">Nav atrasti jautājumi.</p>
                ) : (
                  <ul className="questions-list">
                    {questions.map(question => (
                      <li key={question.id} className="question-item">
                        <div className="question-header">
                          <a href={`/questions/${question.id}`} className="question-title">{question.title}</a>
                          <span className={`question-status status-${question.status}`}>
                            {question.status === 'open' ? 'Atvērts' : 
                             question.status === 'answered' ? 'Atbildēts' : 
                             'Slēgts'}
                          </span>
                        </div>
                        <div className="question-meta">
                          <span className="question-date">{formatDate(question.createdAt)}</span>
                          <span className="question-answers">{question.answers_count} atbildes</span>
                        </div>
                        <div className="question-tags">
                          {question.Tags && question.Tags.map((tag) => (
                            <span key={tag.id} className="tag">{tag.name}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="dashboard-card notifications">
              <div className="card-header">
                <h3>Paziņojumi</h3>
                <a href="#" className="view-all">Atzīmēt visus kā lasītus</a>
              </div>
              <div className="card-content">
                {notifications.length === 0 ? (
                  <p className="empty-state">Nav jaunu paziņojumu.</p>
                ) : (
                  <ul className="notifications-list">
                    {notifications.map(notification => (
                      <li 
                        key={notification.id} 
                        className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                        onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                      >
                        <div className={`notification-icon ${notification.type}`}>
                          {notification.type === 'answer' && '✉️'}
                          {notification.type === 'mention' && '@'}
                          {notification.type === 'system' && '🔔'}
                          {notification.type === 'rating' && '⭐'}
                          {notification.type === 'acceptance' && '✅'}
                        </div>
                        <div className="notification-content">
                          <p>{notification.content}</p>
                          <span className="notification-time">{formatDateTime(notification.createdAt)}</span>
                        </div>
                        {!notification.isRead && <div className="unread-indicator"></div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;