import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { tagService, questionService } from '../services/api';

function HomePage() {
  const [popularTags, setPopularTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch popular tags on component mount
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        setIsLoading(true);
        // Get all tags from the API
        const response = await tagService.getTags();
        
        // We'll need to manually count questions per tag since we don't have a direct API for it
        const tagsWithCounts = await Promise.all(
          response.data.map(async (tag) => {
            try {
              // For each tag, fetch questions with that tag
              const questionsResponse = await questionService.getQuestions({
                tags: tag.id.toString()
              });
              
              return {
                ...tag,
                questionCount: questionsResponse.data.totalItems || 0
              };
            } catch (err) {
              console.error(`Error fetching questions for tag ${tag.name}:`, err);
              return {
                ...tag,
                questionCount: 0
              };
            }
          })
        );
        
        // Sort by question count and take the top 6
        const sortedTags = tagsWithCounts
          .sort((a, b) => b.questionCount - a.questionCount)
          .slice(0, 6);
        
        setPopularTags(sortedTags);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching popular tags:', err);
        setError('Failed to load popular topics');
        setIsLoading(false);
      }
    };

    fetchPopularTags();
  }, []);

  // These functions will be defined in the App component
  const navigateToQuestions = () => {
    // Find the App component in the DOM hierarchy and access its setCurrentPage method
    if (window.navigateToPage) {
      window.navigateToPage('questions');
    } else {
      // Fallback: use direct URL navigation
      window.location.href = '/questions';
    }
  };

  const navigateToRegister = () => {
    if (window.navigateToPage) {
      window.navigateToPage('register');
    } else {
      // Fallback: use direct URL navigation
      window.location.href = '/register';
    }
  };

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Konsultācijas un zināšanu apmaiņa starp lietotājiem un profesionāļiem</h2>
            <p>Uzdodiet jautājumus un saņemiet atbildes no pārbaudītiem speciālistiem dažādās jomās</p>
            <div className="hero-buttons">
              <button 
                className="btn btn-primary"
                onClick={navigateToQuestions}
              >
                Uzdot jautājumu
              </button>
              <button 
                className="btn btn-secondary"
                onClick={navigateToRegister}
              >
                Kļūt par ekspertu
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="features">
        <div className="container">
          <h3>Kāpēc izvēlēties Professional Answers?</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">👨‍🎓</div>
              <h4>Profesionāļu pārbaude</h4>
              <p>Visi eksperti tiek pārbaudīti, lai nodrošinātu kvalificētas atbildes</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h4>Ātras atbildes</h4>
              <p>Saņemiet atbildes no profesionāļiem īsā laikā</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h4>Vienkārša meklēšana</h4>
              <p>Atrodiet atbildes uz jau uzdotiem jautājumiem</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h4>Ekspertu rangs</h4>
              <p>Profesionāļi ar augstākiem vērtējumiem ir īpaši izcilti</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="topics">
        <div className="container">
          <h3>Populārākās tēmas</h3>
          {isLoading ? (
            <div className="loading-topics">Ielāde...</div>
          ) : error ? (
            <div className="error-topics">{error}</div>
          ) : (
            <div className="topics-grid">
              {popularTags.map(tag => (
                <div 
                  key={tag.id} 
                  className="topic-card"
                  onClick={navigateToQuestions}
                >
                  <h4>{tag.name}</h4>
                  <p>{tag.questionCount} jautājumi</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default HomePage;