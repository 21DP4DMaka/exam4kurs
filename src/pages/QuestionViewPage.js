import React, { useState, useEffect } from 'react';
import { questionService, answerService, userService, tagService, questionAttachmentService, commentsService } from '../services/api';
import './QuestionViewPage.css';
import ReportModal from '../components/ReportModal';
import ReviewModal from '../components/ReviewModal';
import AttachmentsViewer from '../components/AttachmentsViewer';
import CommentsComponent from '../components/CommentsComponent';

function QuestionViewPage({ questionId, user, setCurrentPage }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [canAnswer, setCanAnswer] = useState(false);
  const [userTags, setUserTags] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  
  // Load question data and attachments
  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setIsLoading(true);
        const response = await questionService.getQuestionById(questionId);
        setQuestion(response.data);
        
        if (response.data.Answers) {
          // Sort answers - accepted first, then by date
          const sortedAnswers = [...response.data.Answers].sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setAnswers(sortedAnswers);
        }
        
        // Fetch attachments for the question
        try {
          const attachmentsResponse = await questionAttachmentService.getAttachments(questionId);
          setAttachments(attachmentsResponse.data || []);
        } catch (attachmentError) {
          console.error('Error fetching attachments:', attachmentError);
        }
      } catch (error) {
        console.error('Error loading question:', error);
        setError('Error loading question. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (questionId) {
      fetchQuestionData();
    }
  }, [questionId]);
  
  // Load user tags if they are a professional
  useEffect(() => {
    const fetchUserTags = async () => {
      if (user && (user.role === 'power' || user.role === 'admin')) {
        try {
          const response = await tagService.getUserProfessionalTags(user.id);
          setUserTags(response.data);
        } catch (error) {
          console.error('Error loading user tags:', error);
        }
      }
    };
    
    fetchUserTags();
  }, [user]);
  
  // Check if user can answer the question
  useEffect(() => {
    if (user && question && (user.role === 'power' || user.role === 'admin') && userTags.length > 0) {
      // Check if user has any tag that matches question tags
      const questionTagIds = question.Tags.map(tag => tag.id);
      const userTagIds = userTags.map(tag => tag.id);
      
      const hasMatchingTag = questionTagIds.some(tagId => userTagIds.includes(tagId));
      setCanAnswer(hasMatchingTag);
    } else {
      setCanAnswer(false);
    }
  }, [user, question, userTags]);
  
  // Handle opening review modal
  const handleOpenReviewModal = (answerUser) => {
    setTargetUser(answerUser);
    setShowReviewModal(true);
  };
  

  // Handle submitting a review
  const handleSubmitReview = async (reviewData) => {
    try {
      // Include the questionId in the review data
      await userService.createUserReview(reviewData.userId, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        questionId: questionId // Use the current question ID
      });
      
      setSubmitSuccess('Review submitted successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError('Error submitting review. Please try again.');
    }
  };
  
  
  // Handle submitting an answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError('Please log in to answer.');
      return;
    }
    
    if (!canAnswer) {
      setSubmitError('You don\'t have the appropriate tags to answer this question.');
      return;
    }
    
    if (!answerContent.trim()) {
      setSubmitError('Please enter answer content.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await answerService.createAnswer({
        questionId,
        content: answerContent
      });
      
      setSubmitSuccess('Answer added successfully!');
      setAnswerContent('');
      
      // Add the new answer to the answers list
      if (response.data && response.data.answer) {
        setAnswers([response.data.answer, ...answers]);
      }
      
      // Update question status if it changed
      if (question.status === 'open') {
        setQuestion({
          ...question,
          status: 'answered'
        });
      }
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting answer:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setSubmitError(error.response.data.message);
      } else {
        setSubmitError('Error submitting answer. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Accept an answer (if user is question author)
  const handleAcceptAnswer = async (answerId) => {
    if (!user) {
      setError('Please log in to accept an answer.');
      return;
    }
    
    if (!question || user.id !== question.userId) {
      setError('Only the question author can accept an answer.');
      return;
    }
    
    try {
      await answerService.acceptAnswer(answerId);
      
      // Update answers status
      const updatedAnswers = answers.map(answer => ({
        ...answer,
        isAccepted: answer.id === answerId
      }));
      
      setAnswers(updatedAnswers);
      
      // Update question status
      setQuestion({
        ...question,
        status: 'closed'
      });
      
      setSubmitSuccess('Answer accepted as solution!');
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error accepting answer:', error);
      setError('Error accepting answer. Please try again.');
    }
  };
  
  // Navigate back to questions list
  const navigateToQuestions = () => {
    setCurrentPage('questions');
  };
  
  // Navigate to login page
  const navigateToLogin = () => {
    setCurrentPage('login');
  };
  
  // Handle reporting a question
  const handleReportQuestion = async (reason) => {
    try {
      await questionService.reportQuestion(questionId, { reason });
      setSubmitSuccess('Report submitted successfully! Thank you for your contribution.');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError('Error submitting report. Please try again.');
    }
  };

  // Handle deleting a question (admin only)
  const handleDeleteQuestion = async () => {
    if (!user || user.role !== 'admin') {
      setError('Only administrators can delete questions');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await questionService.deleteQuestion(questionId);
      
      // Return to questions page after successful deletion
      setCurrentPage('questions');
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Error deleting question. Please try again.');
      setIsDeleting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };
  
  if (isLoading) {
    return (
      <div className="question-view-page">
        <div className="container">
          <div className="loading-message">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error || !question) {
    return (
      <div className="question-view-page">
        <div className="container">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Question not found.'}</p>
            <button className="btn btn-primary" onClick={navigateToQuestions}>
              Return to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="question-view-page">
      <div className="container">
        <div className="question-navigation">
          <button className="btn btn-outline back-btn" onClick={navigateToQuestions}>
            &larr; Atpakaļ uz jautājumiem
          </button>
          
          <div className={`question-status status-${question.status}`}>
            {question.status === 'open' ? 'Atvērts' : 
             question.status === 'answered' ? 'Atbildēts' : 
             'Slēgts'}
          </div>
        </div>
        
        <div className="question-container">
          <h1 className="question-title">{question.title}</h1>
          
          <div className="question-meta">
            <div className="question-author">
              <span 
                className="author-name"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (question.User && question.User.id) {
                    setCurrentPage('user-profile', question.User.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {question.User ? question.User.username : 'Unknown User'}
              </span>
              <span className="post-date">tika jautāts {formatDate(question.createdAt)}</span>
            </div>
                    
            <div className="question-actions">
              {user && user.role === 'admin' && (
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteQuestion}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Question'}
                </button>
              )}
              
              {user && user.id !== question.userId && (
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowReportModal(true)}
                >
                  Ziņot
                </button>
              )}
            </div>
          </div>
          
          <div className="question-content">
            {question.content}
          </div>
          
          {/* Display attachments if there are any */}
          {attachments.length > 0 && (
            <AttachmentsViewer 
              attachments={attachments}
              questionAttachmentService={questionAttachmentService}
            />
          )}
          
          <div className="question-tags">
            {question.Tags && question.Tags.map(tag => (
              <span key={tag.id} className="question-tag">{tag.name}</span>
            ))}
          </div>
        </div>
        
        <div className="answers-container">
          <h2 className="answers-title">
            {answers.length} {answers.length === 1 ? 'Atbilde' : 'Atbilžu'}
          </h2>
          
          {answers.length === 0 ? (
            <div className="no-answers">
              <p>Atbilžu vēl nav. Esi pirmais, kas atbild!</p>
            </div>
          ) : (
            <div className="answers-list">
              {answers.map(answer => (
                <div key={answer.id} className={`answer ${answer.isAccepted ? 'accepted-answer' : ''}`}>
                {answer.isAccepted && (
                  <div className="accepted-badge">
                    <span className="accepted-icon">✓</span>
                    <span>Pieņemta atbilde</span>
                  </div>
                )}
                
                <div className="answer-content">
                  {answer.content}
                </div>
                
                {/* Comments section for each answer */}
                <CommentsComponent 
                  questionId={question.id}
                  answerId={answer.id}
                  currentUser={user}
                  commentsService={commentsService}
                  questionStatus={question.status} // Added this line
                />
                  
                  <div className="answer-meta">
                    <div className="answer-author">
                      <span 
                        className="author-name"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (answer.User && answer.User.id) {
                            setCurrentPage('user-profile', answer.User.id);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {answer.User ? answer.User.username : 'Unknown User'}
                      </span>
                      {answer.User && answer.User.role && (
                        <span className={`author-badge ${answer.User.role === 'power' ? 'professional' : answer.User.role === 'admin' ? 'admin' : ''}`}>
                          {answer.User.role === 'power' ? 'Profesionāls' : 
                           answer.User.role === 'admin' ? 'Administrator' : ''}
                        </span>
                      )}
                      <span className="answer-date">atbildēja {formatDate(answer.createdAt)}</span>
                    </div>
                    
                    <div className="answer-actions">
                      {/* Button to leave a review - only visible to question author */}
                      {user && 
                       user.id === question.userId && 
                       !answer.isReviewed &&
                       answer.User && 
                       answer.User.id !== user.id && (
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenReviewModal(answer.User)}
                        >
                          Leave Review
                        </button>
                      )}
                      
                      {/* Accept answer button - only visible to question author */}
                      {user && 
                       user.id === question.userId && 
                       question.status !== 'closed' && 
                       !answer.isAccepted && (
                        <button 
                          className="btn btn-outline accept-answer-btn"
                          onClick={() => handleAcceptAnswer(answer.id)}
                        >
                          Accept as Solution
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {submitSuccess && (
            <div className="success-message">
              {submitSuccess}
            </div>
          )}
          
          {submitError && (
            <div className="error-message">
              {submitError}
              {!user && (
                <div className="login-prompt">
                  <button onClick={navigateToLogin} className="btn btn-primary">
                    Log In
                  </button>
                </div>
              )}
            </div>
          )}
          
          {question.status !== 'closed' && (
            <div className="post-answer">
              <h3>Jūsu atbilde</h3>
              
              {!user ? (
                <div className="login-required">
                  <p>Please log in to answer this question.</p>
                  <button className="btn btn-primary" onClick={navigateToLogin}>
                    Log In to Answer
                  </button>
                </div>
              ) : !canAnswer ? (
                <div className="permission-required">
                  <p>Uz šo jautājumu var atbildēt tikai profesionāļi ar atbilstošu tagu.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer}>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      placeholder="Write your answer here..."
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      rows={8}
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportQuestion}
        type="question"
      />
      
      {/* Review Modal */}
      <ReviewModal
  isOpen={showReviewModal}
  onClose={() => setShowReviewModal(false)}
  onSubmit={handleSubmitReview}
  targetUser={targetUser || {}}
  questionId={questionId}
  questionTitle={question.title}
/>
    </div>
  );
}

export default QuestionViewPage;