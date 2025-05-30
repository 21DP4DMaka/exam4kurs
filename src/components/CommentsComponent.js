import React, { useState, useEffect } from 'react';
import './CommentsComponent.css';

const CommentsComponent = ({ questionId, answerId, currentUser, commentsService, questionStatus }) => {
  const [comments, setComments] = useState([]);
  const [commentContext, setCommentContext] = useState({
    questionAuthorId: null,
    answerAuthorId: null
  });
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set debugMode to false in production
  const debugMode = false;

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!answerId) {
        console.log('No answerId provided, cannot load comments');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        if (debugMode) console.log(`Fetching comments for answerId: ${answerId}`);
        
        // Make the API call to get comments
        const response = await commentsService.getComments(answerId);
        
        if (debugMode) console.log('Comments API response:', response);
        
        // Safely extract data from response
        if (response && response.data) {
          const { comments: commentsList = [], questionAuthorId, answerAuthorId } = response.data;
          
          // Convert IDs to numbers for consistent comparison
          setCommentContext({
            questionAuthorId: questionAuthorId ? Number(questionAuthorId) : null,
            answerAuthorId: answerAuthorId ? Number(answerAuthorId) : null
          });
          
          setComments(commentsList || []);
          
          if (debugMode) {
            console.log('Set comment context:', {
              questionAuthorId: Number(questionAuthorId),
              answerAuthorId: Number(answerAuthorId),
              commentsCount: commentsList?.length || 0,
              currentUserId: currentUser ? Number(currentUser.id) : null
            });
          }
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
        setError('Neizdevās ielādēt komentārus. Lūdzu, mēģiniet vēlreiz.');
        
        if (debugMode) {
          console.log('Error details:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [answerId, commentsService, debugMode, currentUser]);

  // Submit a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (debugMode) {
        console.log('Submitting comment with data:', {
          answerId,
          questionId,
          content: newComment,
          currentUserId: currentUser?.id
        });
      }
      
      const response = await commentsService.createComment({
        answerId,
        questionId,
        content: newComment
      });
      
      if (debugMode) console.log('Comment submission response:', response);
      
      // Add the new comment to the list
      if (response.data && response.data.comment) {
        setComments([...comments, response.data.comment]);
      }
      setNewComment('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError('Neizdevās pievienot komentāru. Lūdzu, mēģiniet vēlreiz.');
      
      if (debugMode) {
        console.log('Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can comment
  const canComment = () => {
    if (!currentUser) return false;
    
    // First check if the question is closed
    if (questionStatus === 'closed') return false;
    
    // Parse the IDs as numbers for consistency
    const currentUserId = Number(currentUser.id);
    const questionAuthorId = Number(commentContext.questionAuthorId);
    const answerAuthorId = Number(commentContext.answerAuthorId);
    
    if (debugMode) {
      console.log('Permission check:', {
        currentUserId,
        questionAuthorId,
        answerAuthorId,
        isQuestionAuthor: currentUserId === questionAuthorId,
        isAnswerAuthor: currentUserId === answerAuthorId,
        questionStatus
      });
    }
    
    // Check if current user is either question author or answer author
    return (currentUserId === questionAuthorId) || (currentUserId === answerAuthorId);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };

  return (
    <div className="comments-component">
      <h4 className="comments-title">Komentāri {comments.length > 0 && `(${comments.length})`}</h4>
      
      {error && <div className="comments-error">{error}</div>}
      
      {debugMode && (
        <div style={{background: '#f0f0f0', padding: '10px', marginBottom: '10px', fontSize: '12px', border: '1px solid #ccc'}}>
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify({
              currentUser: currentUser ? { id: Number(currentUser.id), role: currentUser.role } : null,
              commentContext,
              canComment: currentUser ? canComment() : false,
              answerId,
              questionId,
              commentsCount: comments.length,
              questionStatus
            }, null, 2)}</pre>
          </details>
        </div>
      )}
      
      <div className="comments-list">
        {isLoading && !comments.length ? (
          <p className="loading-comments">Ielādē komentārus...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">Nav komentāru. Pievienojiet pirmo!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-name">{comment.User ? comment.User.username : 'Nezināms lietotājs'}</span>
                  {comment.User && Number(comment.User.id) === Number(commentContext.questionAuthorId) && (
                    <span className="author-badge question-author">Jautātājs</span>
                  )}
                  {comment.User && Number(comment.User.id) === Number(commentContext.answerAuthorId) && (
                    <span className="author-badge answer-author">Atbildētājs</span>
                  )}
                </div>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))
        )}
      </div>
      
      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <textarea
            className="comment-input"
            placeholder="Rakstiet savu komentāru šeit..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isLoading || !canComment()}
          ></textarea>
          {!canComment() && questionStatus === 'closed' && (
            <p className="comments-permission-note">
              Komentāru pievienošana nav iespējama, jo jautājums ir slēgts.
            </p>
          )}
          {!canComment() && questionStatus !== 'closed' && (
            <p className="comments-permission-note">
              Tikai jautājuma autors un atbildētājs var pievienot komentārus.
            </p>
          )}
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={isLoading || !newComment.trim() || !canComment()}
          >
            {isLoading ? 'Iesniedz...' : 'Pievienot komentāru'}
          </button>
        </form>
      ) : (
        <p className="login-to-comment">Lūdzu, <a href="#login">pieslēdzieties</a>, lai pievienotu komentāru.</p>
      )}
    </div>
  );
};

export default CommentsComponent;