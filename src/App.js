import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import AdminTagApplicationsPage from './pages/AdminTagApplicationsPage';
import { authService } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'register', 'dashboard', 'professional-profile', 'admin-tag-applications'
  const [isLoading, setIsLoading] = useState(true);
  
  // Pārbaudīt, vai lietotājs jau ir pieteicies (pārbaudot tokenu)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
          setIsLoggedIn(true);
          
          // Ja lietotājs mēģina piekļūt login/register, novirziet uz dashboard
          if (currentPage === 'login' || currentPage === 'register') {
            setCurrentPage('dashboard');
          }
        } catch (error) {
          // Ja tokens nav derīgs, noņemt to
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, [currentPage]);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
  };
  
  const handleRegister = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };
  
  // Pagaidām vienkāršs maršrutētājs - vēlāk aizstāt ar React Router
  const renderPage = () => {
    if (isLoading) {
      return <div className="loading-container">Ielāde...</div>;
    }
    
    switch(currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage onRegister={handleRegister} />;
      case 'dashboard':
        // Ja lietotājs nav pieteicies, novirziet uz pieteikšanās lapu
        return isLoggedIn ? <DashboardPage user={user} setCurrentPage={setCurrentPage} /> : <LoginPage onLogin={handleLogin} />;
      case 'professional-profile':
        // Pārbaudīt, vai lietotājs ir profesionālis vai administrators
        if (!isLoggedIn) {
          return <LoginPage onLogin={handleLogin} />;
        }
        if (user && (user.role === 'power' || user.role === 'admin')) {
          return <ProfessionalProfilePage />;
        }
        return <DashboardPage user={user} setCurrentPage={setCurrentPage} />;
      case 'admin-tag-applications':
        // Pārbaudīt, vai lietotājs ir administrators
        if (!isLoggedIn) {
          return <LoginPage onLogin={handleLogin} />;
        }
        if (user && user.role === 'admin') {
          return <AdminTagApplicationsPage />;
        }
        return <DashboardPage user={user} setCurrentPage={setCurrentPage} />;
      case 'home':
      default:
        return <HomePage />;
    }
  };
  
  return (
    <div className="App">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        setCurrentPage={setCurrentPage}
      />
      {renderPage()}
      <Footer />
    </div>
  );
}

export default App;