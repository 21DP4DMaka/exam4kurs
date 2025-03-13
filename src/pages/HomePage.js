import React from 'react';
import './HomePage.css';

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Konsultācijas un zināšanu apmaiņa starp lietotājiem un profesionāļiem</h2>
            <p>Uzdodiet jautājumus un saņemiet atbildes no pārbaudītiem speciālistiem dažādās jomās</p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Uzdot jautājumu</button>
              <button className="btn btn-secondary">Kļūt par ekspertu</button>
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
          <div className="topics-grid">
            <div className="topic-card">
              <h4>Programmēšana</h4>
              <p>256 jautājumi</p>
            </div>
            <div className="topic-card">
              <h4>Finanses</h4>
              <p>124 jautājumi</p>
            </div>
            <div className="topic-card">
              <h4>Tiesības</h4>
              <p>89 jautājumi</p>
            </div>
            <div className="topic-card">
              <h4>Medicīna</h4>
              <p>75 jautājumi</p>
            </div>
            <div className="topic-card">
              <h4>Izglītība</h4>
              <p>67 jautājumi</p>
            </div>
            <div className="topic-card">
              <h4>Celtniecība</h4>
              <p>52 jautājumi</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;