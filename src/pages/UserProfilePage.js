import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './UserProfilePage.css';
import { userService, questionService } from '../services/api';
import { truncateText } from '../utils/textUtils';

function UserProfilePage({ profileUserId, currentUser, setCurrentPage }) {
  const [profileUser, setProfileUser] = useState(null);
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const userResponse = await userService.getUserById(profileUserId);
        setProfileUser(userResponse.data);
        
        // Fetch user's questions
        const questionsResponse = await questionService.getUserQuestions(profileUserId);
        setUserQuestions(questionsResponse.data.questions || []);
        
        // Fetch user's answers if they are a professional
        if (userResponse.data.role === 'power' || userResponse.data.role === 'admin') {
          try {
            const answersResponse = await userService.getUserAnswers(profileUserId);
            setUserAnswers(answersResponse.data.answers || []);
          } catch (error) {
            console.error('Error fetching user answers:', error);
          }
        }
        
        // Fetch user reviews
        const reviewsResponse = await userService.getUserReviews(profileUserId);
        setReviews(reviewsResponse.data.reviews || []);
        setAverageRating(reviewsResponse.data.averageRating || 0);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again.');
        setIsLoading(false);
      }
    };
    
    if (profileUserId) {
      fetchUserProfile();
    }
  }, [profileUserId]);

  const formatEmail = (email) => {
    return email || 'Nav norādīts e-pasts';
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };
  
  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  if (isLoading) {
    return <div className="loading-spinner">Ielāde...</div>;
  }
  
  if (error && !profileUser) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="error-container">
            <h2>Kļūda</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={navigateToDashboard}>
              Atgriezties uz instrumentu paneli
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="error-container">
            <h2>Lietotājs nav atrasts</h2>
            <button className="btn btn-primary" onClick={navigateToDashboard}>
              Atgriezties uz instrumentu paneli
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="profile-navigation">
          <button className="btn btn-outline back-btn" onClick={navigateToDashboard}>
            &larr; Atpakaļ
          </button>
        </div>
        
        <div className="profile-header">
          <div className="profile-avatar">
            <img 
              src={profileUser.profileImage || "https://via.placeholder.com/150"} 
              alt={`${profileUser.username} profila attēls`}
            />
          </div>
          
          <div className="profile-info">
            <div className="profile-name-container">
              <h2>{profileUser.username}</h2>
              
              {/* Display workplace next to username if exists and user is professional */}
              {profileUser.role === 'power' && profileUser.ProfessionalProfile?.workplace && (
                <span className="profile-workplace">
                  <i className="workplace-icon">🏢</i> {profileUser.ProfessionalProfile.workplace}
                </span>
              )}
            </div>
            
            {profileUser.email && (
              <div className="profile-email">
                <span>{formatEmail(profileUser.email)}</span>
              </div>
            )}
            
            <div className="profile-meta">
              <span className="profile-role">
                {profileUser.role === 'admin' ? 'Administrators' : 
                 profileUser.role === 'power' ? 'Profesionālis' : 'Lietotājs'}
              </span>
              
              {averageRating > 0 && (
                <div className="profile-rating">
                  <div className="stars-display">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        style={{ 
                          color: star <= Math.round(averageRating) ? '#f59e0b' : '#e2e8f0',
                          fontSize: '1.2rem'
                        }}
                      >
                        {star <= Math.round(averageRating) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="rating-value">{averageRating.toFixed(1)}</span>
                  <span className="reviews-count">({reviews.length} atsauksmes)</span>
                </div>
              )}
              <span className="profile-date">
                Reģistrējies: {formatDate(profileUser.createdAt)}
              </span>
            </div>
            
            {/* Add edit profile button if viewing own profile */}
            {currentUser && currentUser.id === profileUser.id && (
              <div className="profile-actions">
                <button 
                  className="btn btn-primary edit-profile-btn"
                  onClick={() => setCurrentPage('edit-profile')}
                >
                  Rediģēt profilu
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Display bio section above content if exists */}
        {profileUser.bio && (
          <div className="profile-bio-container">
            <h3>Par mani</h3>
            <p>{profileUser.bio}</p>
          </div>
        )}
        
        <div className="profile-content">
          <div className="profile-main">
            {/* Show questions for regular users and answers for professionals */}
            <div className="dashboard-card user-content">
              <div className="card-header">
                <h3>
                  {profileUser.role === 'power' || profileUser.role === 'admin' 
                    ? 'Lietotāja atbildes' 
                    : 'Lietotāja jautājumi'}
                </h3>
              </div>
              <div className="card-content">
                {profileUser.role === 'power' || profileUser.role === 'admin' ? (
                  // Show answers for professionals
                  userAnswers && userAnswers.length > 0 ? (
                    <ul className="answers-list">
                      {userAnswers.map(answer => (
                        <li key={answer.id} className="answer-item">
                          <div className="answer-header">
                            <a 
                              href={`/questions/${answer.questionId}`} 
                              className="question-title"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('question-view', answer.questionId);
                              }}
                            >
                              {answer.Question ? answer.Question.title : 'Nezināms jautājums'}
                            </a>
                            {answer.isAccepted && (
                              <span className="answer-accepted">✓ Pieņemta</span>
                            )}
                          </div>
                          <div className="answer-meta">
                            <span className="answer-date">{formatDate(answer.createdAt)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Lietotājs vēl nav sniedzis atbildes.</p>
                  )
                ) : (
                  // Show questions for regular users
                  userQuestions.length > 0 ? (
                    <ul className="questions-list">
                      {userQuestions.map(question => (
                        <li key={question.id} className="question-item">
                          <div className="question-header">
                            <a 
                              href={`/questions/${question.id}`} 
                              className="question-title"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('question-view', question.id);
                              }}
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
                            <span className="question-date">{formatDate(question.createdAt)}</span>
                            <span className="question-answers">{question.answers_count || 0} atbildes</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Lietotājs vēl nav uzdevis jautājumus.</p>
                  )
                )}
              </div>
            </div>
            
            {/* Show reviews section only for professionals */}
            {(profileUser.role === 'power' || profileUser.role === 'admin') && (
              <div className="dashboard-card reviews-section">
                <div className="card-header">
                  <h3>Atsauksmes</h3>
                </div>
                <div className="card-content">
                  {/* Only show existing reviews, no form for adding new ones */}
                  <div className="reviews-list">
                    <h4>Visas atsauksmes ({reviews.length})</h4>
                    
                    {reviews.length === 0 ? (
                      <p className="empty-state">Šim lietotājam vēl nav atsauksmju.</p>
                    ) : (
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
                          {/* Display associated question with link */}
                          {review.Question && (
                            <div className="review-question">
                              <span>Jautājums: </span>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage('question-view', review.Question.id);
                                }}
                                className="question-link"
                              >
                                {review.Question.title}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="profile-sidebar">
            {/* Show professional categories for professionals */}
            {profileUser.role === 'power' && (
              <div className="dashboard-card user-tags">
                <div className="card-header">
                  <h3>Profesionālās kategorijas</h3>
                </div>
                <div className="card-content">
                  {profileUser.ProfessionalProfile && 
                   profileUser.ProfessionalProfile.Tags && 
                   profileUser.ProfessionalProfile.Tags.length > 0 ? (
                    <div className="tag-list">
                      {profileUser.ProfessionalProfile.Tags.map(tag => (
                        <span key={tag.id} className="profile-tag">{tag.name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Lietotājam nav profesionālo kategoriju.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* User stats */}
            <div className="dashboard-card user-stats">
              <div className="card-header">
                <h3>Statistika</h3>
              </div>
              <div className="card-content">
                {profileUser.role === 'regular' && (
                  <div className="stat-item">
                    <span className="stat-label">Jautājumi:</span>
                    <span className="stat-value">{userQuestions ? userQuestions.length : 0}</span>
                  </div>
                )}
                {(profileUser.role === 'power' || profileUser.role === 'admin') && (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Atbildes:</span>
                      <span className="stat-value">{userAnswers ? userAnswers.length : 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Pieņemtas atbildes:</span>
                      <span className="stat-value">
                        {userAnswers ? userAnswers.filter(answer => answer.isAccepted).length : 0}
                      </span>
                    </div>
                  </>
                )}
                {(profileUser.role === 'power' || profileUser.role === 'admin') && (
                  <div className="stat-item">
                    <span className="stat-label">Vidējais vērtējums:</span>
                    <span className="stat-value">{averageRating > 0 ? averageRating.toFixed(1) : 'Nav'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;