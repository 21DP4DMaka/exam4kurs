import React, { useState, useEffect } from 'react';
import './TagApplicationModal.css';
import { tagService } from '../services/api';

function TagApplicationModal({ isOpen, onClose, onSuccess, availableTags }) {
  const [selectedTag, setSelectedTag] = useState('');
  const [applicationFile, setApplicationFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    if(isOpen) {
      setSelectedTag('');
      setApplicationFile(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle closing the modal
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle tag selection
  const handleTagChange = (event) => {
    setSelectedTag(event.target.value);
    setError(null);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setApplicationFile(file);
        setError(null);
      } else {
        setApplicationFile(null);
        setError('Lūdzu, izvēlieties PDF formāta failu');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form
    if (!selectedTag) {
      setError('Lūdzu, izvēlieties kategoriju (tagu)');
      return;
    }
    
    if (!applicationFile) {
      setError('Lūdzu, augšupielādējiet PDF failu ar jūsu diplomu vai sertifikātu');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('tagId', selectedTag);
      formData.append('document', applicationFile);
      
      // Submit application
      await tagService.applyForTag(formData);
      
      // Handle success
      onSuccess && onSuccess('Pieteikums veiksmīgi iesniegts! Administrators to izskatīs tuvākajā laikā.');
      onClose();
    } catch (error) {
      console.error('Kļūda, iesniedzot pieteikumu:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Radās kļūda, iesniedzot pieteikumu. Lūdzu, mēģiniet vēlreiz.');
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
          <h3>Iesniegt pieteikumu profesionālajam tagam</h3>
          <button className="tag-modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="tag-application-modal-form">
          {error && <div className="tag-modal-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="tagSelect">Izvēlieties profesionālo kategoriju (tagu):</label>
            <select 
              id="tagSelect" 
              value={selectedTag} 
              onChange={handleTagChange}
              className="form-control"
              disabled={isSubmitting}
            >
              <option value="">-- Izvēlieties kategoriju --</option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="documentUpload">Augšupielādējiet savu diplomu vai sertifikātu (PDF):</label>
            <div className="file-upload-container">
              <input 
                type="file" 
                id="documentUpload" 
                accept="application/pdf" 
                onChange={handleFileChange}
                className="file-input"
                disabled={isSubmitting}
              />
              <label htmlFor="documentUpload" className="file-upload-label">
                <span className="file-icon">📁</span>
                <span className="file-text">
                  {applicationFile ? applicationFile.name : 'Izvēlieties failu'}
                </span>
              </label>
            </div>
            <small className="form-text">
              Lūdzu, augšupielādējiet PDF failu, kas apstiprina jūsu kvalifikāciju izvēlētajā jomā.
              Administrators pārbaudīs dokumentu un apstiprinās jūsu profesionālo statusu.
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
              disabled={isSubmitting || !selectedTag || !applicationFile}
            >
              {isSubmitting ? 'Iesniedz...' : 'Iesniegt pieteikumu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TagApplicationModal;