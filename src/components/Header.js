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
            <li><a href="/questions" onClick={(e) => e.preventDefault()}>Jautājumi</a></li>
            <li><a href="/tags" onClick={(e) => e.preventDefault()}>Kategorijas</a></li>
            <li><a href="/about" onClick={(e) => e.preventDefault()}>Par mums</a></li>
            
            {/* Administratora saite tagu pieteikumiem (tikai adminiem) */}
            {isLoggedIn && user && user.role === 'admin' && (
              <li>
                <a 
                  href="/admin-applications" 
                  onClick={(e) => handleNavigation('admin-tag-applications', e)}
                >
                  Tagu Pieteikumi
                </a>
              </li>
            )}
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
                  {user && user.role === 'admin' && <span className="role-badge admin">Admin</span>}
                  {user && user.role === 'power' && <span className="role-badge power">Pro</span>}
                </a>
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