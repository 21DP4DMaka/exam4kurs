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
import UserProfilePage from './pages/UserProfilePage';
import { authService } from './services/api';
import AboutUsPage from './pages/AboutUsPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Make the setCurrentPage function globally available for components that can't receive it as props
  useEffect(() => {
    window.navigateToPage = (page, param = null) => {
      setCurPage(page, param);
    };
    
    return () => {
      // Clean up when component unmounts
      delete window.navigateToPage;
    };
  }, []);
  
  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
          setIsLoggedIn(true);
          
          // Redirect to dashboard if accessing login/register pages while logged in
          if (currentPage === 'login' || currentPage === 'register') {
            setCurrentPage('dashboard');
          }
        } catch (error) {
          // If token is invalid, remove it
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
  
  // Handle question selection
  const handleViewQuestion = (questionId) => {
    console.log("Opening question with ID:", questionId);
    setSelectedQuestionId(questionId);
    setCurrentPage('question-view');
  };
  
  // Handle user profile navigation
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
  
  // Simple router - replace with React Router later
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
        // If user is not logged in, redirect to login page
        return isLoggedIn ? 
          <DashboardPage 
            user={user} 
            setCurrentPage={setCurPage} 
            handleViewQuestion={handleViewQuestion} 
          /> : 
          <LoginPage onLogin={handleLogin} />;
      case 'professional-profile':
        // Check if user is professional or administrator
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
        // Check if user is administrator
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
      case 'about':
        // Add this new case for the About Us page
        return <AboutUsPage setCurrentPage={setCurPage} />;
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