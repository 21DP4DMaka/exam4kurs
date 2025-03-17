import React, { useState, useEffect } from 'react';
import { questionService, tagService } from '../services/api';
import './QuestionsPage.css';

function QuestionsPage({ setCurrentPage, handleViewQuestion }) {
  const [questions, setQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  
  // Filtrēšanas un meklēšanas stāvokļi
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'answered', 'closed'
  
  // Ielādēt jautājumus un tagus
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Ielādēt tagus
        const tagsResponse = await tagService.getTags();
        setAvailableTags(tagsResponse.data);
        
        await fetchQuestions();
      } catch (error) {
        console.error('Kļūda ielādējot datus:', error);
        setError('Kļūda ielādējot datus. Lūdzu, mēģiniet vēlreiz.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Ielādēt jautājumus ar filtriem
  const fetchQuestions = async (page = 1) => {
    try {
      setIsLoading(true);
      
      const params = {
        page,
        limit: 10 // Jautājumu skaits lapā
      };
      
      // Pievienot meklēšanas parametru
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      // Pievienot tagu filtru
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      
      // Pievienot statusa filtru
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await questionService.getQuestions(params);
      
      setQuestions(response.data.questions);
      setTotalPages(response.data.totalPages);
      setCurrentPageNum(response.data.currentPage);
    } catch (error) {
      console.error('Kļūda ielādējot jautājumus:', error);
      setError('Kļūda ielādējot jautājumus. Lūdzu, mēģiniet vēlreiz.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apstrādāt lapošanu
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchQuestions(newPage);
    }
  };
  
  // Apstrādāt meklēšanu
  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuestions(1); // Sākt no pirmās lapas, kad mainās meklēšanas kritēriji
  };
  
  // Apstrādāt tagu izvēli
  const handleTagToggle = (tagId) => {
    const tagIdInt = parseInt(tagId);
    const isSelected = selectedTags.includes(tagIdInt);
    
    if (isSelected) {
      setSelectedTags(selectedTags.filter(id => id !== tagIdInt));
    } else {
      setSelectedTags([...selectedTags, tagIdInt]);
    }
  };
  
  // Apstrādāt tagu filtra piemērošanu
  const applyTagsFilter = () => {
    fetchQuestions(1);
  };
  
  // Apstrādāt statusa filtra maiņu
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    fetchQuestions(1);
  };
  
  // Notīrīt visus filtrus
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setStatusFilter('all');
    fetchQuestions(1);
  };
  
  // Navigēt uz jautājuma uzdošanas lapu
  const navigateToAskQuestion = () => {
    setCurrentPage('ask-question');
  };
  
  // Navigēt uz jautājuma skatu
  const viewQuestion = (id) => {
    if (handleViewQuestion) {
      handleViewQuestion(id);
    }
  };
  
  // Formatē datumu
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('lv-LV', options);
  };
  
  return (
    <div className="questions-page">
      <div className="container">
        <div className="questions-header">
          <h2>Jautājumi</h2>
          <button 
            className="btn btn-primary ask-question-btn"
            onClick={navigateToAskQuestion}
          >
            Uzdot jaunu jautājumu
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-button">×</button>
          </div>
        )}
        
        <div className="questions-filters">
          <div className="search-box">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Meklēt jautājumos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary search-btn">
                Meklēt
              </button>
            </form>
          </div>
          
          <div className="filter-section">
            <div className="status-filter">
              <span className="filter-label">Statuss:</span>
              <div className="status-buttons">
                <button 
                  className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('all')}
                >
                  Visi
                </button>
                <button 
                  className={`status-btn ${statusFilter === 'open' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('open')}
                >
                  Atvērti
                </button>
                <button 
                  className={`status-btn ${statusFilter === 'answered' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('answered')}
                >
                  Atbildēti
                </button>
                <button 
                  className={`status-btn ${statusFilter === 'closed' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('closed')}
                >
                  Slēgti
                </button>
              </div>
            </div>
            
            <div className="tag-filter">
              <span className="filter-label">Kategorijas:</span>
              <div className="tag-filter-container">
                {availableTags.map(tag => (
                  <div 
                    key={tag.id} 
                    className={`tag-filter-item ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="apply-filter">
                  <button 
                    className="btn btn-sm btn-outline apply-filter-btn"
                    onClick={applyTagsFilter}
                  >
                    Piemērot filtrus
                  </button>
                  <button 
                    className="btn btn-sm clear-filter-btn"
                    onClick={clearFilters}
                  >
                    Notīrīt visus filtrus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-message">Ielāde...</div>
        ) : questions.length === 0 ? (
          <div className="no-questions">
            <p>Nav atrasti jautājumi atbilstoši jūsu meklēšanas kritērijiem.</p>
            {(searchQuery || selectedTags.length > 0 || statusFilter !== 'all') && (
              <button 
                className="btn btn-primary clear-all-btn"
                onClick={clearFilters}
              >
                Notīrīt visus filtrus
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="questions-list">
              {questions.map(question => (
                <div key={question.id} className="question-card">
                  <div className="question-stats">
                    <div className="stat">
                      <span className="stat-value">{question.answers_count || 0}</span>
                      <span className="stat-label">Atbildes</span>
                    </div>
                    <div className={`status-indicator status-${question.status}`}>
                      {question.status === 'open' ? 'Atvērts' : 
                       question.status === 'answered' ? 'Atbildēts' : 
                       'Slēgts'}
                    </div>
                  </div>
                  
                  <div className="question-details">
                    <h3 className="question-title">
                      <a 
                        href={`/questions/${question.id}`} 
                        onClick={(e) => {
                          e.preventDefault();
                          viewQuestion(question.id);
                        }}
                      >
                        {question.title}
                      </a>
                    </h3>
                    
                    <div className="question-excerpt">
                      {question.content.length > 200 
                        ? `${question.content.substring(0, 200)}...` 
                        : question.content}
                    </div>
                    
                    <div className="question-meta">
                      <div className="question-tags">
                        {question.Tags && question.Tags.map(tag => (
                          <span key={tag.id} className="question-tag">{tag.name}</span>
                        ))}
                      </div>
                      
                      <div className="question-info">
                        <span className="question-author">
                          {question.User ? question.User.username : 'Nezināms lietotājs'}
                        </span>
                        <span className="question-date">
                          {formatDate(question.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  disabled={currentPageNum === 1}
                  onClick={() => handlePageChange(currentPageNum - 1)}
                >
                  &laquo; Iepriekšējā
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPageNum === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  disabled={currentPageNum === totalPages}
                  onClick={() => handlePageChange(currentPageNum + 1)}
                >
                  Nākamā &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionsPage;