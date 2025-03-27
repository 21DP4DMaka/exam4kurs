// src/components/CommentsComponent.js - Fixed version

import React, { useState, useEffect } from 'react';
import './CommentsComponent.css';

const CommentsComponent = ({ questionId, answerId, currentUser, commentsService }) => {
  const [comments, setComments] = useState([]);
  const [commentContext, setCommentContext] = useState({
    questionAuthorId: null,
    answerAuthorId: null
  });
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!answerId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await commentsService.getComments(answerId);
        
        // Extract comments and author IDs from response
        const { comments: commentsList = [], questionAuthorId, answerAuthorId } = response.data;
        
        setComments(commentsList || []);
        setCommentContext({
          questionAuthorId,
          answerAuthorId
        });
      } catch (err) {
        console.error('Failed to load comments:', err);
        setError('Neizdevās ielādēt komentārus. Lūdzu, mēģiniet vēlreiz.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [answerId, commentsService]);

  // Submit a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await commentsService.createComment({
        answerId,
        questionId,
        content: newComment
      });
      
      // Add the new comment to the list
      if (response.data && response.data.comment) {
        setComments([...comments, response.data.comment]);
      }
      setNewComment('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError('Neizdevās pievienot komentāru. Lūdzu, mēģiniet vēlreiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can comment - fixed logic
  const canComment = () => {
    if (!currentUser) return false;
    
    // Debug info
    console.log('Current user:', currentUser.id);
    console.log('Question author:', commentContext.questionAuthorId);
    console.log('Answer author:', commentContext.answerAuthorId);
    
    // The question author and the answer author can always comment
    if (currentUser.id === commentContext.questionAuthorId || currentUser.id === commentContext.answerAuthorId) {
      return true;
    }
    
    return false;
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
      
      <div className="comments-list">
        {isLoading ? (
          <p className="loading-comments">Ielādē komentārus...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">Nav komentāru. Pievienojiet pirmo!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-name">{comment.User ? comment.User.username : 'Nezināms lietotājs'}</span>
                  {comment.User && comment.User.id === commentContext.questionAuthorId && (
                    <span className="author-badge question-author">Jautātājs</span>
                  )}
                  {comment.User && comment.User.id === commentContext.answerAuthorId && (
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
          {!canComment() && (
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