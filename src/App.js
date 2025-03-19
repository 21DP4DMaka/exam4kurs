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
import AdminUsersPage from './pages/AdminUsersPage';
import QuestionsPage from './pages/QuestionsPage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionViewPage from './pages/QuestionViewPage';
import UserProfilePage from './pages/UserProfilePage'; // Import the new component
import { authService } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'register', 'dashboard', 'professional-profile', 'admin-tag-applications', 'admin-users', 'questions', 'ask-question', 'question-view', 'user-profile'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // Add state for selected user ID
  
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
  
  // Apstrādāt jautājuma atlasi
  const handleViewQuestion = (questionId) => {
    console.log("Opening question with ID:", questionId); // Debug log
    setSelectedQuestionId(questionId);
    setCurrentPage('question-view');
  };
  
  // Add a function to handle user profile navigation
  const handleViewUserProfile = (userId) => {
    console.log("Opening user profile with ID:", userId);
    setSelectedUserId(userId);
    setCurrentPage('user-profile');
  };
  
  // Custom setCurrentPage function to handle additional parameters
  const setCurPage = (page, param = null) => {
    console.log(`Setting current page to: ${page}, with param: ${param}`);
    
    if (page === 'question-view' && param) {
      setSelectedQuestionId(param);
    } else if (page === 'user-profile' && param) {
      setSelectedUserId(param);
    }
    setCurrentPage(page);
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
        return isLoggedIn ? 
          <DashboardPage 
            user={user} 
            setCurrentPage={setCurPage} 
            handleViewQuestion={handleViewQuestion} 
          /> : 
          <LoginPage onLogin={handleLogin} />;
      case 'professional-profile':
        // Pārbaudīt, vai lietotājs ir profesionālis vai administrators
        if (!isLoggedIn) {
          return <LoginPage onLogin={handleLogin} />;
        }
        if (user && (user.role === 'power' || user.role === 'admin')) {
          return <ProfessionalProfilePage />;
        }
        return <DashboardPage 
          user={user} 
          setCurrentPage={setCurPage} 
          handleViewQuestion={handleViewQuestion} 
        />;
      case 'admin-tag-applications':
        // Pārbaudīt, vai lietotājs ir administrators
        if (!isLoggedIn) {
          return <LoginPage onLogin={handleLogin} />;
        }
        if (user && user.role === 'admin') {
          return <AdminTagApplicationsPage />;
        }
        return <DashboardPage 
          user={user} 
          setCurrentPage={setCurPage} 
          handleViewQuestion={handleViewQuestion}
        />;
      case 'admin-users':
        // Check if user is administrator
        if (!isLoggedIn) {
          return <LoginPage onLogin={handleLogin} />;
        }
        if (user && user.role === 'admin') {
          return <AdminUsersPage />;
        }
        return <DashboardPage 
          user={user} 
          setCurrentPage={setCurPage} 
          handleViewQuestion={handleViewQuestion}
        />;
      case 'questions':
        return <QuestionsPage 
          setCurrentPage={setCurPage} 
          handleViewQuestion={handleViewQuestion} 
        />;
      case 'ask-question':
        return <AskQuestionPage user={user} setCurrentPage={setCurPage} />;
      case 'question-view':
        console.log("Rendering question view for ID:", selectedQuestionId); // Debug log
        if (!selectedQuestionId) {
          return <QuestionsPage 
            setCurrentPage={setCurPage} 
            handleViewQuestion={handleViewQuestion} 
          />;
        }
        return <QuestionViewPage 
          questionId={selectedQuestionId} 
          user={user} 
          setCurrentPage={setCurPage} 
        />;
        case 'user-profile':
          console.log("Rendering user profile for ID:", selectedUserId);
          if (!selectedUserId) {
            return <DashboardPage 
              user={user} 
              setCurrentPage={setCurPage} 
              handleViewQuestion={handleViewQuestion} 
            />;
          }
          return <UserProfilePage 
          profileUserId={selectedUserId} 
          currentUser={user} 
          setCurrentPage={setCurPage} 
        />;
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
        setCurrentPage={setCurPage}
      />
      <main>
      {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;