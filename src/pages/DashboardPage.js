import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import { authService, questionService, notificationService, userService } from '../services/api';

function DashboardPage({ user: passedUser, setCurrentPage, handleViewQuestion }) {
  const [user, setUser] = useState(passedUser || null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    unreadNotifications: 0,
    askedQuestions: 0,    // For regular users
    answeredCount: 0      // For professional users
  });
  
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
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
  
  // Ielādēt jautājumus, paziņojumus un atsauksmes, kad lietotājs ir ielādēts
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
        
        // Ielādēt atsauksmes, ja lietotājs ir profesionālis
        if (user.role === 'power' || user.role === 'admin') {
          try {
            const reviewsResponse = await userService.getUserReviews(user.id);
            setReviews(reviewsResponse.data.reviews || []);
            
            // Load how many questions this professional has answered
            const answersResponse = await userService.getUserAnswers(user.id);
            const answeredCount = answersResponse.data.answers ? answersResponse.data.answers.length : 0;
            
            // Uzstādīt statistiku ar atbildēto jautājumu skaitu profesionālim
            setStats({
              totalQuestions: questionsResponse.data.totalItems,
              answeredQuestions: questionsResponse.data.questions.filter(q => q.status === 'answered').length,
              pendingQuestions: questionsResponse.data.questions.filter(q => q.status === 'open').length,
              unreadNotifications: notificationsResponse.data.unreadCount,
              answeredCount: answeredCount // Atbildēto jautājumu skaits profesionālim
            });
          } catch (error) {
            console.error('Kļūda ielādējot atsauksmes vai atbildes:', error);
            
            // Set stats without answers count if there was an error
            setStats({
              totalQuestions: questionsResponse.data.totalItems,
              answeredQuestions: questionsResponse.data.questions.filter(q => q.status === 'answered').length,
              pendingQuestions: questionsResponse.data.questions.filter(q => q.status === 'open').length,
              unreadNotifications: notificationsResponse.data.unreadCount,
              answeredCount: 0
            });
          }
        } else {
          // For regular users, show asked questions count
          try {
            const userQuestionsResponse = await questionService.getUserQuestions(user.id);
            const askedQuestions = userQuestionsResponse.data.questions ? userQuestionsResponse.data.questions.length : 0;
            
            // Uzstādīt statistiku ar uzdoto jautājumu skaitu parastajam lietotājam
            setStats({
              totalQuestions: questionsResponse.data.totalItems,
              answeredQuestions: questionsResponse.data.questions.filter(q => q.status === 'answered').length,
              pendingQuestions: questionsResponse.data.questions.filter(q => q.status === 'open').length,
              unreadNotifications: notificationsResponse.data.unreadCount,
              askedQuestions: askedQuestions // Uzdoto jautājumu skaits parastajam lietotājam
            });
          } catch (error) {
            console.error('Kļūda ielādējot lietotāja jautājumus:', error);
            
            // Set stats without asked questions count if there was an error
            setStats({
              totalQuestions: questionsResponse.data.totalItems,
              answeredQuestions: questionsResponse.data.questions.filter(q => q.status === 'answered').length,
              pendingQuestions: questionsResponse.data.questions.filter(q => q.status === 'open').length,
              unreadNotifications: notificationsResponse.data.unreadCount,
              askedQuestions: 0
            });
          }
        }
        
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
  
  // Funkcija, kas apstrādā klikšķu notikumu uz jautājumiem
  const onQuestionClick = (questionId, e) => {
    e.preventDefault();
    console.log("Clicked on question:", questionId);
    if (handleViewQuestion) {
      handleViewQuestion(questionId);
    }
  };

  // Function to navigate to user profile
  const handleViewUserProfile = (userId, e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the question click event
    console.log("Viewing user profile:", userId);
    setCurrentPage('user-profile', userId);
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
               user.role === 'power' ? 'Profesionālis' : 'Lietotājs'}
            </p>
          </div>
          <button 
  className="btn btn-outline"
  onClick={() => setCurrentPage('user-profile', user.id)}
>
  Skatīt manu profilu
</button>
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
              <div className="stat-value">{stats.pendingQuestions}</div>
              <div className="stat-label">Gaidoši</div>
            </div>
            {/* New stat card for professional users - showing answered questions count */}
            {(user.role === 'power' || user.role === 'admin') && (
              <div className="stat-card">
                <div className="stat-value">{stats.answeredCount}</div>
                <div className="stat-label">Jūsu atbildes</div>
              </div>
            )}
            {/* New stat card for regular users - showing asked questions count */}
            {user.role === 'regular' && (
              <div className="stat-card">
                <div className="stat-value">{stats.askedQuestions}</div>
                <div className="stat-label">Jūsu jautājumi</div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-value">{stats.unreadNotifications}</div>
              <div className="stat-label">Nelasīti paziņojumi</div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card recent-questions">
              <div className="card-header">
                <h3>Lietotāju atsauksmes</h3>
                <a href="#" className="view-all">Skatīt visas</a>
              </div>
              <div className="card-content">
                {(user.role === 'power' || user.role === 'admin') ? (
                  reviews && reviews.length > 0 ? (
                    <div className="reviews-container">
                      {reviews.map((review) => (
                        <div key={review.id} className="review-item">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <span className="reviewer-name">
                                {review.Reviewer ? review.Reviewer.username : 'Nezināms lietotājs'}
                              </span>
                              <span className="review-date">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="review-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                  key={star} 
                                  style={{ 
                                    color: star <= review.rating ? '#f59e0b' : '#e2e8f0',
                                    fontSize: '1.2rem'
                                  }}
                                >
                                  {star <= review.rating ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="review-content">
                            {review.comment}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="reviews-container">
                      <p className="empty-state">Jums vēl nav atsauksmju.</p>
                    </div>
                  )
                ) : (
                  <div className="reviews-container">
                    <p className="empty-state">Atsauksmes pieejamas tikai profesionāļiem.</p>
                  </div>
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
                          onClick={(e) => {
                            // Mark as read if unread
                            if (!notification.isRead) {
                              markNotificationAsRead(notification.id);
                            }
                            
                            // Navigate to the related question if available
                            if (notification.relatedQuestionId) {
                              console.log(`Navigating to question ID: ${notification.relatedQuestionId}`);
                              setCurrentPage('question-view', notification.relatedQuestionId);
                            }
                          }}
                          style={{ cursor: notification.relatedQuestionId ? 'pointer' : 'default' }}
                        >
                          <div className={`notification-icon ${notification.type}`}>
                            {notification.type === 'answer' && '✉️'}
                            {notification.type === 'mention' && '@'}
                            {notification.type === 'system' && '🔔'}
                            {notification.type === 'rating' && '⭐'}
                            {notification.type === 'acceptance' && '✅'}
                            {notification.type === 'question' && '❓'}
                            {notification.type === 'comment' && '💭'}
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
          
          <div className="dashboard-card latest-questions">
            <div className="card-header">
              <h3>Jaunākie jautājumi</h3>
              <a href="#" className="view-all" onClick={(e) => {
                e.preventDefault();
                setCurrentPage('questions');
              }}>Skatīt visus</a>
            </div>
            <div className="card-content">
              {questions.length === 0 ? (
                <p className="empty-state">Nav atrasti jautājumi.</p>
              ) : (
                <ul className="questions-list">
                  {questions.map(question => (
                    <li key={question.id} className="question-item" style={{ cursor: 'pointer' }} onClick={(e) => onQuestionClick(question.id, e)}>
                      <div className="question-header">
                        <a 
                          href={`/questions/${question.id}`} 
                          className="question-title"
                          onClick={(e) => onQuestionClick(question.id, e)}
                        >
                          {question.title}
                        </a>
                        <span className={`question-status status-${question.status}`}>
                          {question.status === 'open' ? 'Atvērts' : 
                           question.status === 'answered' ? 'Atbildēts' : 
                           'Slēgts'}
                        </span>
                      </div>
                      <div className="question-meta">
                        <span 
                          className="question-author" 
                          onClick={(e) => handleViewUserProfile(question.User.id, e)}
                        >
                          {question.User ? question.User.username : 'Nezināms lietotājs'}
                        </span>
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
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;