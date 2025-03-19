import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './UserProfilePage.css';
import { userService, questionService } from '../services/api';

function UserProfilePage({ profileUserId, currentUser, setCurrentPage }) {
  const [profileUser, setProfileUser] = useState(null);
  const [userQuestions, setUserQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRatingChange = (rating) => {
    setNewReview({...newReview, rating});
  };
  
  const handleCommentChange = (e) => {
    setNewReview({...newReview, comment: e.target.value});
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to leave a review');
      return;
    }
    
    if (newReview.rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!newReview.comment.trim()) {
      setError('Please write a comment for your review');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await userService.createUserReview(profileUserId, {
        rating: newReview.rating,
        comment: newReview.comment
      });
      
      // Add the new review to the list
      const newReviewData = response.data.review;
      setReviews([newReviewData, ...reviews]);
      
      // Update average rating
      setAverageRating(response.data.averageRating);
      
      // Reset the form
      setNewReview({ rating: 0, comment: '' });
      
      setSuccess('Review submitted successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
            <h2>{profileUser.username}</h2>
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
                        className={`star ${star <= Math.round(averageRating) ? 'filled' : ''}`}
                      >
                        ★
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
            
            {profileUser.bio && (
              <div className="profile-bio">
                <h3>Par mani</h3>
                <p>{profileUser.bio}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-content">
          <div className="profile-main">
            <div className="dashboard-card reviews-section">
              <div className="card-header">
                <h3>Atsauksmes</h3>
              </div>
              <div className="card-content">
                {/* Create new review form */}
                {currentUser && currentUser.id !== profileUserId && (
                  <div className="review-form-container">
                    <h4>Pievienot atsauksmi</h4>
                    
                    {success && (
                      <div className="success-message">
                        {success}
                        <button onClick={() => setSuccess(null)} className="close-button">×</button>
                      </div>
                    )}
                    
                    {error && (
                      <div className="error-message">
                        {error}
                        <button onClick={() => setError(null)} className="close-button">×</button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmitReview} className="review-form">
                      <div className="rating-selection">
                        <label>Jūsu vērtējums:</label>
                        <div className="stars-input">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              className={`star ${star <= newReview.rating ? 'selected' : ''}`}
                              onClick={() => handleRatingChange(star)}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="reviewComment">Jūsu komentārs:</label>
                        <textarea
                          id="reviewComment"
                          value={newReview.comment}
                          onChange={handleCommentChange}
                          placeholder="Uzrakstiet savu atsauksmi par šo lietotāju..."
                          className="form-control"
                          rows={4}
                          disabled={isSubmitting}
                        ></textarea>
                      </div>
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting || newReview.rating === 0 || !newReview.comment.trim()}
                      >
                        {isSubmitting ? 'Nosūta...' : 'Iesniegt atsauksmi'}
                      </button>
                    </form>
                  </div>
                )}
                
                {/* Reviews list */}
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
                              <span className="reviewer-name">{review.reviewer.username}</span>
                              <span className="review-date">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="review-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                  key={star} 
                                  className={`star ${star <= review.rating ? 'filled' : ''}`}
                                >
                                  ★
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
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="profile-sidebar">
            <div className="dashboard-card user-questions">
              <div className="card-header">
                <h3>Lietotāja jautājumi</h3>
              </div>
              <div className="card-content">
                {userQuestions.length === 0 ? (
                  <p className="empty-state">Lietotājs vēl nav uzdevis jautājumus.</p>
                ) : (
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
                )}
              </div>
            </div>
            
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;