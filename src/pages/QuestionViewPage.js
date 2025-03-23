import React, { useState, useEffect } from 'react';
import { questionService, answerService, userService, tagService } from '../services/api';
import './QuestionViewPage.css';
import ReportModal from '../components/ReportModal';
import ReviewModal from '../components/ReviewModal';

function QuestionViewPage({ questionId, user, setCurrentPage }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
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
  
  // Ielādēt jautājuma datus
  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setIsLoading(true);
        const response = await questionService.getQuestionById(questionId);
        setQuestion(response.data);
        
        if (response.data.Answers) {
          // Sakārtot atbildes - vispirms pieņemtās, tad pēc datuma
          const sortedAnswers = [...response.data.Answers].sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setAnswers(sortedAnswers);
        }
      } catch (error) {
        console.error('Kļūda ielādējot jautājumu:', error);
        setError('Kļūda ielādējot jautājumu. Lūdzu, mēģiniet vēlreiz.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (questionId) {
      fetchQuestionData();
    }
  }, [questionId]);
  
  // Ielādēt lietotāja tagus, ja ir profesionālis
  useEffect(() => {
    const fetchUserTags = async () => {
      if (user && (user.role === 'power' || user.role === 'admin')) {
        try {
          const response = await tagService.getUserProfessionalTags(user.id);
          setUserTags(response.data);
        } catch (error) {
          console.error('Kļūda ielādējot lietotāja tagus:', error);
        }
      }
    };
    
    fetchUserTags();
  }, [user]);
  
  // Pārbaudīt, vai lietotājs var atbildēt uz jautājumu
  useEffect(() => {
    if (user && question && (user.role === 'power' || user.role === 'admin') && userTags.length > 0) {
      // Pārbaudīt, vai lietotājam ir kāds tags, kas sakrīt ar jautājuma tagiem
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
      await userService.createUserReview(reviewData.userId, {
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      
      setSubmitSuccess('Atsauksme veiksmīgi iesniegta!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Kļūda iesniedzot atsauksmi:', error);
      setSubmitError('Kļūda iesniedzot atsauksmi. Lūdzu, mēģiniet vēlreiz.');
    }
  };
  
  // Atbildes iesniegšana
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError('Lai atbildētu, jums jāpieslēdzas.');
      return;
    }
    
    if (!canAnswer) {
      setSubmitError('Jums nav atbilstošo kategoriju, lai atbildētu uz šo jautājumu.');
      return;
    }
    
    if (!answerContent.trim()) {
      setSubmitError('Lūdzu, ievadiet atbildes saturu.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await answerService.createAnswer({
        questionId,
        content: answerContent
      });
      
      setSubmitSuccess('Atbilde veiksmīgi pievienota!');
      setAnswerContent('');
      
      // Pievienot jauno atbildi atbilžu sarakstam
      if (response.data && response.data.answer) {
        setAnswers([response.data.answer, ...answers]);
      }
      
      // Atjaunināt jautājuma statusu, ja tas mainījies
      if (question.status === 'open') {
        setQuestion({
          ...question,
          status: 'answered'
        });
      }
      
      // Pēc 3 sekundēm noņemt veiksmīgo ziņojumu
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Kļūda iesniedzot atbildi:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setSubmitError(error.response.data.message);
      } else {
        setSubmitError('Kļūda iesniedzot atbildi. Lūdzu, mēģiniet vēlreiz.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Pieņemt atbildi (ja lietotājs ir jautājuma autors)
  const handleAcceptAnswer = async (answerId) => {
    if (!user) {
      setError('Lai pieņemtu atbildi, jums jāpieslēdzas.');
      return;
    }
    
    if (!question || user.id !== question.userId) {
      setError('Tikai jautājuma autors var pieņemt atbildi.');
      return;
    }
    
    try {
      await answerService.acceptAnswer(answerId);
      
      // Atjaunināt atbilžu statusu
      const updatedAnswers = answers.map(answer => ({
        ...answer,
        isAccepted: answer.id === answerId
      }));
      
      setAnswers(updatedAnswers);
      
      // Atjaunināt jautājuma statusu
      setQuestion({
        ...question,
        status: 'closed'
      });
      
      setSubmitSuccess('Atbilde veiksmīgi pieņemta kā risinājums!');
      
      // Pēc 3 sekundēm noņemt veiksmīgo ziņojumu
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Kļūda pieņemot atbildi:', error);
      setError('Kļūda pieņemot atbildi. Lūdzu, mēģiniet vēlreiz.');
    }
  };
  
  // Navigēt atpakaļ uz jautājumu sarakstu
  const navigateToQuestions = () => {
    setCurrentPage('questions');
  };
  
  // Navigēt uz pieteikšanas lapu
  const navigateToLogin = () => {
    setCurrentPage('login');
  };
  
  // Handle reporting a question
  const handleReportQuestion = async (reason) => {
    try {
      await questionService.reportQuestion(questionId, { reason });
      setSubmitSuccess('Ziņojums veiksmīgi iesniegts! Paldies par jūsu ieguldījumu platformas uzturēšanā.');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Kļūda iesniedzot ziņojumu:', error);
      setSubmitError('Kļūda iesniedzot ziņojumu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  // Handle deleting a question (admin only)
  const handleDeleteQuestion = async () => {
    if (!user || user.role !== 'admin') {
      setError('Tikai administratori var dzēst jautājumus');
      return;
    }
    
    if (!window.confirm('Vai tiešām vēlaties dzēst šo jautājumu? Šo darbību nevar atsaukt.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await questionService.deleteQuestion(questionId);
      
      // Return to questions page after successful deletion
      setCurrentPage('questions');
    } catch (error) {
      console.error('Kļūda dzēšot jautājumu:', error);
      setError('Kļūda dzēšot jautājumu. Lūdzu, mēģiniet vēlreiz.');
      setIsDeleting(false);
    }
  };
  
  // Formatē datumu
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };
  
  if (isLoading) {
    return (
      <div className="question-view-page">
        <div className="container">
          <div className="loading-message">Ielāde...</div>
        </div>
      </div>
    );
  }
  
  if (error || !question) {
    return (
      <div className="question-view-page">
        <div className="container">
          <div className="error-container">
            <h2>Kļūda</h2>
            <p>{error || 'Jautājums nav atrasts.'}</p>
            <button className="btn btn-primary" onClick={navigateToQuestions}>
              Atgriezties pie jautājumiem
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
            &larr; Atpakaļ pie jautājumiem
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
              {question.User ? question.User.username : 'Nezināms lietotājs'}
            </span>
            <span className="post-date">jautāja {formatDate(question.createdAt)}</span>
          </div>
                    
            <div className="question-actions">
              {user && user.role === 'admin' && (
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteQuestion}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Dzēš...' : 'Dzēst jautājumu'}
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
          
          <div className="question-tags">
            {question.Tags && question.Tags.map(tag => (
              <span key={tag.id} className="question-tag">{tag.name}</span>
            ))}
          </div>
        </div>
        
        <div className="answers-container">
          <h2 className="answers-title">
            {answers.length} {answers.length === 1 ? 'Atbilde' : 'Atbildes'}
          </h2>
          
          {answers.length === 0 ? (
            <div className="no-answers">
              <p>Pagaidām nav atbilžu. Kļūstiet par pirmo, kas atbild!</p>
            </div>
          ) : (
            <div className="answers-list">
              {answers.map(answer => (
                <div key={answer.id} className={`answer ${answer.isAccepted ? 'accepted-answer' : ''}`}>
                  {answer.isAccepted && (
                    <div className="accepted-badge">
                      <span className="accepted-icon">✓</span>
                      <span>Pieņemtā atbilde</span>
                    </div>
                  )}
                  
                  <div className="answer-content">
                    {answer.content}
                  </div>
                  
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
                        {answer.User ? answer.User.username : 'Nezināms lietotājs'}
                      </span>
                      {answer.User && answer.User.role && (
                        <span className={`author-badge ${answer.User.role === 'power' ? 'professional' : answer.User.role === 'admin' ? 'admin' : ''}`}>
                          {answer.User.role === 'power' ? 'Profesionālis' : 
                           answer.User.role === 'admin' ? 'Administrators' : ''}
                        </span>
                      )}
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
                          Atstāt atsauksmi
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
                          Pieņemt kā risinājumu
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
                    Pieslēgties
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
                  <p>Lai atbildētu uz šo jautājumu, jums jāpieslēdzas.</p>
                  <button className="btn btn-primary" onClick={navigateToLogin}>
                    Pieslēgties, lai atbildētu
                  </button>
                </div>
              ) : !canAnswer ? (
                <div className="permission-required">
                  <p>Tikai profesionāļi ar atbilstošiem kategorijas tagiem var atbildēt uz šo jautājumu.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer}>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      placeholder="Rakstiet savu atbildi šeit..."
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
                    {isSubmitting ? 'Iesniedz...' : 'Iesniegt atbildi'}
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
      />
    </div>
  );
}

export default QuestionViewPage;