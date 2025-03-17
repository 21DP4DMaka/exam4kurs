// src/components/ReportModal.js
import React, { useState, useEffect } from 'react';
import './TagApplicationModal.css'; // Reuse the existing modal styles

function ReportModal({ isOpen, onClose, onSubmit, type = 'question' }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  // Handle closing the modal
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!reason.trim()) {
      setError('Lūdzu, norādiet ziņojuma iemeslu');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Submit report via callback
      await onSubmit(reason);
      
      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Kļūda iesniedzot ziņojumu:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Radās kļūda iesniedzot ziņojumu. Lūdzu, mēģiniet vēlreiz.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="tag-modal-overlay" onClick={handleClose}>
      <div className="tag-modal-content" onClick={e => e.stopPropagation()}>
        <div className="tag-modal-header">
          <h3>Ziņot par {type === 'question' ? 'jautājumu' : 'lietotāju'}</h3>
          <button className="tag-modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="tag-application-modal-form">
          {error && <div className="tag-modal-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="reportReason">Ziņojuma iemesls:</label>
            <textarea 
              id="reportReason" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Lūdzu, norādiet, kāpēc ziņojat par šo ${type === 'question' ? 'jautājumu' : 'lietotāju'}`}
              className="form-control"
              rows={4}
              disabled={isSubmitting}
            />
            <small className="form-text">
              {type === 'question' 
                ? 'Norādiet, kāpēc šis jautājums pārkāpj lietošanas noteikumus (piem., nepiemērota valoda, krāpšana, spam).' 
                : 'Norādiet, kāpēc šis lietotājs pārkāpj lietošanas noteikumus (piem., nepiedienīgs saturs, aizskaroša uzvedība).'}
            </small>
          </div>
          
          <div className="tag-modal-footer">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Atcelt
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? 'Iesniedz...' : 'Iesniegt ziņojumu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;