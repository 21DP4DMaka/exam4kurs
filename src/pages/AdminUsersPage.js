// src/pages/AdminUsersPage.js
// This modification fixes the "Skatīt profilu" button functionality

import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './AdminPages.css';
import AdminDashboardStats from '../components/AdminDashboardStats';
import { authService, userService } from '../services/api';

function AdminUsersPage({ setCurrentPage }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [showStats, setShowStats] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data.user);

        // Check if user is admin
        if (userResponse.data.user.role !== 'admin') {
          setError('Tikai administratoriem ir atļauts piekļūt šai lapai.');
          setIsLoading(false);
          return;
        }

        // Load users
        await loadUsers();

        setIsLoading(false);
      } catch (error) {
        console.error('Kļūda ielādējot datus:', error);
        setError('Neizdevās ielādēt datus. Lūdzu, mēģiniet vēlreiz.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load users with search and pagination
  const loadUsers = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: searchQuery
      };

      const response = await userService.getUsers(params);
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setCurrentPageNum(response.data.currentPage);
    } catch (error) {
      console.error('Kļūda ielādējot lietotājus:', error);
      setError('Neizdevās ielādēt lietotājus. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  // Open action modal
  const openModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setActionType('');
    setReason('');
  };

  // Handle action submit (ban, unban, delete)
  const handleActionSubmit = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);

      if (actionType === 'ban') {
        await userService.banUser(selectedUser.id, { reason });
        setSuccess(`Lietotājs ${selectedUser.username} veiksmīgi bloķēts.`);
      } else if (actionType === 'unban') {
        await userService.unbanUser(selectedUser.id);
        setSuccess(`Lietotājs ${selectedUser.username} veiksmīgi atbloķēts.`);
      } else if (actionType === 'delete') {
        await userService.deleteUser(selectedUser.id);
        setSuccess(`Lietotājs ${selectedUser.username} veiksmīgi dzēsts.`);
      }

      // Reload users
      await loadUsers(currentPage);
      closeModal();
    } catch (error) {
      console.error(`Kļūda ${actionType === 'ban' ? 'bloķējot' : actionType === 'unban' ? 'atbloķējot' : 'dzēšot'} lietotāju:`, error);
      setError(`Neizdevās ${actionType === 'ban' ? 'bloķēt' : actionType === 'unban' ? 'atbloķēt' : 'dzēst'} lietotāju. Lūdzu, mēģiniet vēlreiz.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadUsers(page);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Toggle statistics view
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // Handle view profile - FIXED FUNCTION
  const handleViewProfile = (userId) => {
    if (setCurrentPage) {
      // Navigate to the user profile page with the user ID as a parameter
      setCurrentPage('user-profile', userId);
    } else {
      console.error("setCurrentPage function is not available");
    }
  };

  if (isLoading) return <div className="loading-spinner">Ielāde...</div>;
  if (error && !user) return <div className="error-message">{error}</div>;
  
  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="auth-card">
            <h2>Pieeja liegta</h2>
            <p>Šī sadaļa ir pieejama tikai administratoriem.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <h2>Lietotāju pārvaldība</h2>
        
        {success && (
          <div className="success-message">
            {success}
            <button onClick={() => setSuccess(null)} className="close-button">×</button>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-button">×</button>
          </div>
        )}

        {/* Toggle button for statistics */}
        <div className="stats-toggle-container">
          <button 
            className={`btn ${showStats ? 'btn-primary' : 'btn-outline'}`}
            onClick={toggleStats}
          >
            {showStats ? 'Slēpt statistiku' : 'Rādīt statistiku'}
          </button>
        </div>
        
        {/* Statistics Dashboard - conditionally shown */}
        {showStats && <AdminDashboardStats />}
        
        <div className="search-box">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Meklēt lietotājus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary search-btn">
              Meklēt
            </button>
          </form>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Lietotāju saraksts</h3>
          </div>
          <div className="card-content">
            {users.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lietotājvārds</th>
                    <th>E-pasts</th>
                    <th>Loma</th>
                    <th>Statuss</th>
                    <th>Reģistrācijas datums</th>
                    <th>Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id} className={userItem.status === 'banned' ? 'banned-user' : ''}>
                      <td>{userItem.username}</td>
                      <td>{userItem.email}</td>
                      <td>
                        {userItem.role === 'admin' && 'Administrators'}
                        {userItem.role === 'power' && 'Profesionālis'}
                        {userItem.role === 'regular' && 'Lietotājs'}
                      </td>
                      <td>
                        <span className={`status-badge ${userItem.status}`}>
                          {userItem.status === 'active' && 'Aktīvs'}
                          {userItem.status === 'banned' && 'Bloķēts'}
                          {userItem.status === 'suspended' && 'Apturēts'}
                        </span>
                      </td>
                      <td>{formatDate(userItem.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {userItem.role !== 'admin' && (
                            <>
                              {userItem.status === 'active' ? (
                                <button 
                                  onClick={() => openModal(userItem, 'ban')} 
                                  className="btn btn-sm btn-danger"
                                >
                                  Bloķēt
                                </button>
                              ) : (
                                <button 
                                  onClick={() => openModal(userItem, 'unban')} 
                                  className="btn btn-sm btn-success"
                                >
                                  Atbloķēt
                                </button>
                              )}
                              <button 
                                onClick={() => openModal(userItem, 'delete')} 
                                className="btn btn-sm btn-danger"
                              >
                                Dzēst
                              </button>
                            </>
                          )}
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleViewProfile(userItem.id)}
                          >
                            Skatīt profilu
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Nav atrasti lietotāji ar izvēlēto meklēšanas kritēriju.</p>
            )}
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  &laquo; Iepriekšējā
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Nākamā &raquo;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {actionType === 'ban' && 'Bloķēt lietotāju'}
              {actionType === 'unban' && 'Atbloķēt lietotāju'}
              {actionType === 'delete' && 'Dzēst lietotāju'}
            </h3>
            
            <p className="modal-user-info">
              Lietotājs: <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
            </p>
            
            {actionType === 'ban' && (
              <div className="form-group">
                <label htmlFor="banReason">Bloķēšanas iemesls:</label>
                <textarea
                  id="banReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Norādiet iemeslu, kāpēc lietotājs tiek bloķēts"
                  className="form-control"
                  rows={3}
                />
              </div>
            )}
            
            {actionType === 'delete' && (
              <div className="warning-message">
                <p>Brīdinājums: Šī darbība ir neatgriezeniska. Lietotāja dati un visi saistītie jautājumi un atbildes tiks neatgriezeniski dzēsti.</p>
                <div className="form-group">
                  <label htmlFor="deleteReason">Dzēšanas iemesls (neobligāts):</label>
                  <textarea
                    id="deleteReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Norādiet iemeslu, kāpēc lietotājs tiek dzēsts"
                    className="form-control"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <div className="modal-buttons">
              <button 
                onClick={handleActionSubmit} 
                className={`btn ${actionType === 'unban' ? 'btn-success' : 'btn-danger'}`}
                disabled={isLoading || (actionType === 'ban' && !reason.trim())}
              >
                {isLoading ? 'Apstrādā...' : (
                  actionType === 'ban' ? 'Bloķēt' : 
                  actionType === 'unban' ? 'Atbloķēt' : 
                  'Dzēst'
                )}
              </button>
              <button 
                onClick={closeModal} 
                className="btn btn-outline"
                disabled={isLoading}
              >
                Atcelt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;