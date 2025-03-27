import React, { useState, useEffect } from 'react';
import './TagApplicationModal.css';

function ReviewModal({ isOpen, onClose, onSubmit, targetUser, questionId, questionTitle }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setError(null);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (rating === 0) {
      setError('Lūdzu, izvēlieties vērtējumu (1-5 zvaigznes)');
      return;
    }
    
    if (!comment.trim()) {
      setError('Lūdzu, ievadiet komentāru');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Call the provided onSubmit function with rating, comment, and questionId
      await onSubmit({
        userId: targetUser.id,
        rating,
        comment,
        questionId
      });
      
      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Kļūda iesniedzot atsauksmi:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Radās kļūda iesniedzot atsauksmi. Lūdzu, mēģiniet vēlreiz.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="tag-modal-overlay" onClick={onClose}>
      <div className="tag-modal-content" onClick={e => e.stopPropagation()}>
        <div className="tag-modal-header">
          <h3>Atstāt atsauksmi par {targetUser.username || 'lietotāju'}</h3>
          <button className="tag-modal-close" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="tag-application-modal-form">
          {error && <div className="tag-modal-error">{error}</div>}
          
          {questionTitle && (
            <div className="form-group">
              <label>Jautājums:</label>
              <div className="question-reference">{questionTitle}</div>
            </div>
          )}
          
          <div className="form-group">
            <label>Jūsu vērtējums:</label>
            <div className="stars-input" style={{ fontSize: '2rem', display: 'flex', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  style={{ 
                    cursor: 'pointer',
                    color: star <= rating ? '#f59e0b' : '#e2e8f0'
                  }}
                  onClick={() => setRating(star)}
                >
                  {star <= rating ? '★' : '☆'}
                </span>
              ))}
            </div>
            <small className="form-text">
              Izvēlieties no 1 līdz 5 zvaigznēm
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="reviewComment">Jūsu komentārs:</label>
            <textarea 
              id="reviewComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Uzrakstiet savu atsauksmi par lietotāju..."
              className="form-control"
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="tag-modal-footer">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Atcelt
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
            >
              {isSubmitting ? 'Iesniedzam...' : 'Iesniegt atsauksmi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;