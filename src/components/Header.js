// src/components/Header.js
// This modification fixes the navigation for the "Tagu Pieteikumi" button

import React from 'react';
import './Header.css';

function Header({ isLoggedIn, user, onLogout, setCurrentPage }) {
  const handleNavigation = (page, event) => {
    event.preventDefault();
    setCurrentPage(page);
  };
  
  return (
    <header className="app-header">
      <div className="container">
        <h1 onClick={(e) => handleNavigation('home', e)} style={{ cursor: 'pointer' }}>
          Professional Answers
        </h1>
        <nav>
        <ul>
          <li><a href="/" onClick={(e) => handleNavigation('home', e)}>Sākums</a></li>
          <li><a href="/questions" onClick={(e) => handleNavigation('questions', e)}>Jautājumi</a></li>
          <li><a href="/about" onClick={(e) => handleNavigation('about', e)}>Par mums</a></li>
        </ul>
          <div className="auth-buttons">
            {!isLoggedIn ? (
              <>
                <button 
                  className="btn btn-outline"
                  onClick={(e) => handleNavigation('login', e)}
                >
                  Pieslēgties
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => handleNavigation('register', e)}
                >
                  Reģistrēties
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/dashboard" 
                  className="profile-link"
                  onClick={(e) => handleNavigation('dashboard', e)}
                >
                  {user ? user.username : 'Mans profils'}
                  {user && user.role === 'admin' && <span className="role-badge admin">Admins</span>}
                  {user && user.role === 'power' && <span className="role-badge power">Profesionāls</span>}
                  {user && user.role === 'regular' && <span className="role-badge regular">Lietotājs</span>}
                </a>
                
                {/* Admin buttons for user management and tag applications */}
                {isLoggedIn && user && user.role === 'admin' && (
                  <>
                    <button 
                      className="btn btn-primary admin-users-btn"
                      onClick={(e) => handleNavigation('admin-users', e)}
                    >
                      Lietotāju pārvalde
                    </button>
                    <button 
                      className="btn btn-primary admin-app-btn"
                      onClick={(e) => handleNavigation('admin-tag-applications', e)}
                    >
                      Tagu Pieteikumi
                    </button>
                  </>
                )}
                
                {/* Only regular users can ask questions */}
                {isLoggedIn && user && user.role === 'regular' && (
                  <button
                    className="btn btn-primary ask-question-btn"
                    onClick={(e) => handleNavigation('ask-question', e)}
                  > 
                    Uzdot jautājumu
                  </button>
                )}
                
                {/* Pro Profils button for professional users */}
                {isLoggedIn && user && user.role === 'power' && (
                  <button 
                    className="btn btn-profils"
                    onClick={(e) => handleNavigation('professional-profile', e)}
                  >
                    Profesionāla Profils
                  </button>
                )}
                
                <button 
                  className="btn btn-outline"
                  onClick={onLogout}
                >
                  Izrakstīties
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;