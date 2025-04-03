// src/pages/BannedUserPage.js
import React from 'react';
import './AuthPages.css';

function BannedUserPage({ banReason, onLogout }) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Konts bloķēts</h2>
          <div className="ban-message">
            <p>Jūsu konts ir bloķēts un piekļuve platformai ir ierobežota.</p>
            {banReason && (
              <div className="ban-reason">
                <h3>Bloķēšanas iemesls:</h3>
                <p>{banReason}</p>
              </div>
            )}
            <p>Ja uzskatāt, ka tas ir kļūda, lūdzu, sazinieties ar mūms - info@professionalanswers.lv</p>
          </div>
          
          <button 
            onClick={onLogout} 
            className="btn btn-primary btn-block"
            style={{ marginTop: '20px' }}
          >
            Izrakstīties
          </button>
        </div>
      </div>
    </div>
  );
}

export default BannedUserPage;