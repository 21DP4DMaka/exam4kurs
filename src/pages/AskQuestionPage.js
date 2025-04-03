import React, { useState, useEffect } from 'react';
import { questionService, tagService, questionAttachmentService } from '../services/api';
import './AskQuestionPage.css';
import FileUploadComponent from '../components/FileUploadComponent';

function AskQuestionPage({ user, setCurrentPage }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [attachments, setAttachments] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Load tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await tagService.getTags();
        setAvailableTags(response.data);
      } catch (error) {
        console.error('Kļūda ielādējot tagus:', error);
        setError('Neizdevās ielādēt tagu sarakstu. Lūdzu, mēģiniet vēlreiz.');
      }
    };
    
    fetchTags();
    
    if (user) {
      setIsLoggedIn(true);
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleTagChange = (e) => {
    const tagId = parseInt(e.target.value);
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagId]
      });
    } else {
      setFormData({
        ...formData,
        tags: formData.tags.filter(id => id !== tagId)
      });
    }
  };
  
  const handleFilesChange = (files) => {
    setAttachments(files);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Lūdzu, pieslēdzieties, lai uzdotu jautājumu.');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Lūdzu, ievadiet jautājuma virsrakstu.');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Lūdzu, ievadiet jautājuma saturu.');
      return;
    }
    
    if (formData.tags.length === 0) {
      setError('Lūdzu, izvēlieties vismaz vienu tagu.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the question first
      const questionResponse = await questionService.createQuestion({
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      });
      
      const questionId = questionResponse.data.question.id;
      
      // If there are attachments, upload them
      if (attachments.length > 0) {
        const attachmentFormData = new FormData();
        attachments.forEach(file => {
          attachmentFormData.append('files', file);
        });
        
        try {
          await questionAttachmentService.uploadAttachments(questionId, attachmentFormData);
        } catch (attachmentError) {
          console.error('Kļūda augšupielādējot pielikumus:', attachmentError);
          setSuccess('Jautājums veiksmīgi izveidots, bet neizdevās augšupielādēt pielikumus.');
          setFormData({
            title: '',
            content: '',
            tags: []
          });
          setAttachments([]);
          setTimeout(() => {
            setCurrentPage('question-view', questionId);
          }, 2000);
          return;
        }
      }
      
      setSuccess('Jautājums veiksmīgi izveidots!');
      setFormData({
        title: '',
        content: '',
        tags: []
      });
      setAttachments([]);
      
      // After 2 seconds, redirect to the question view
      setTimeout(() => {
        setCurrentPage('question-view', questionId);
      }, 2000);
    } catch (error) {
      console.error('Kļūda veidojot jautājumu:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Kļūda izveidojot jautājumu. Lūdzu, mēģiniet vēlreiz.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToLogin = () => {
    setCurrentPage('login');
  };
  
  return (
    <div className="ask-question-page">
      <div className="container">
        <h2>Uzdot jaunu jautājumu</h2>
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
            {!isLoggedIn && (
              <div className="login-prompt">
                <button onClick={navigateToLogin} className="btn btn-primary">
                  Pieslēgties
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="question-form-container">
          <div className="question-form-guidance">
            <h3>Kā uzdot labu jautājumu?</h3>
            <ul>
              <li>Izvēlieties precīzu un saprotamu virsrakstu</li>
              <li>Detalizēti aprakstiet problēmu vai jautājumu</li>
              <li>Sniedziet nepieciešamo kontekstu un informāciju</li>
              <li>Pārbaudiet pareizrakstību un gramatiku</li>
              <li>Izvēlieties atbilstošus tagus, lai jautājums nonāktu pie pareizajiem ekspertiem</li>
              <li>Pievienojiet līdz 2 failiem (PDF vai PNG), ja nepieciešams</li>
            </ul>
          </div>
          
          <form onSubmit={handleSubmit} className="question-form">
            <div className="form-group">
              <label htmlFor="title">Jautājuma virsraksts*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Piemēram: Kā pareizi aprēķināt iedzīvotāju ienākuma nodokli?"
                className="form-control"
                disabled={isLoading || !isLoggedIn}
              />
              <small className="form-text">
                Īss, konkrēts virsraksts, kas apraksta jūsu jautājumu
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Jautājuma saturs*</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Detalizēti aprakstiet savu jautājumu..."
                className="form-control"
                rows={10}
                disabled={isLoading || !isLoggedIn}
              ></textarea>
              <small className="form-text">
                Detalizēti aprakstiet savu jautājumu, sniedzot visu nepieciešamo informāciju
              </small>
            </div>
            
            <div className="form-group">
              <label>Pielikumi (neobligāti)</label>
              <FileUploadComponent 
                onFilesChange={handleFilesChange}
                maxFiles={2}
              />
            </div>
            
            <div className="form-group">
              <label>Tagi*</label>
              <div className="tags-container">
                {availableTags.map(tag => (
                  <div key={tag.id} className="tag-option">
                    <input
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      value={tag.id}
                      checked={formData.tags.includes(tag.id)}
                      onChange={handleTagChange}
                      disabled={isLoading || !isLoggedIn}
                    />
                    <label htmlFor={`tag-${tag.id}`}>{tag.name}</label>
                  </div>
                ))}
              </div>
              <small className="form-text">
                Izvēlieties vismaz vienu tagu, lai jautājums nonāktu pie atbilstošiem ekspertiem
              </small>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isLoading || !isLoggedIn}
            >
              {isLoading ? 'Iesniedz...' : 'Iesniegt jautājumu'}
            </button>
            
            {!isLoggedIn && (
              <div className="login-required-message">
                <p>Lai uzdotu jautājumu, jums nepieciešams pieslēgties.</p>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={navigateToLogin}
                >
                  Pieslēgties
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AskQuestionPage;