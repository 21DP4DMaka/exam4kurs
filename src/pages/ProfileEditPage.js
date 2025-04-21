// src/pages/ProfileEditPage.js - Updated to handle default avatar
import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './UserProfilePage.css';
import './ProfileEditPage.css';
import { authService, userService } from '../services/api';

// Predefined avatar options
const AVATAR_OPTIONS = [
  "/images/avatars/1.jpg",
  "/images/avatars/2.png",
  "/images/avatars/3.jpeg",
  "/images/avatars/4.png",
];

function ProfileEditPage({ setCurrentPage }) {
  // User data state
  const [user, setUser] = useState(null);
  
  // Form data state with password fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: '/images/avatars/1.jpg' // Default avatar
  });
  
  // UI state
  const [selectedAvatar, setSelectedAvatar] = useState(0); // Default to first avatar
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        const userData = response.data.user;
        setUser(userData);
        
        console.log("Loaded user data:", userData);
        
        // Set initial form data from user profile
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.bio || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImage: userData.profileImage || '/images/avatars/1.jpg'
        });
        
        // Set selected avatar if user has a profile image
        if (userData.profileImage) {
          // If the user's current avatar is one of our predefined options, select it
          const avatarIndex = AVATAR_OPTIONS.indexOf(userData.profileImage);
          if (avatarIndex !== -1) {
            setSelectedAvatar(avatarIndex);
          } else {
            // Otherwise, we'll use their custom avatar
            setSelectedAvatar(0); // Default to first avatar
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Neizdevās ielādēt lietotāja datus. Lūdzu, mēģiniet vēlreiz.');
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle avatar selection
  const handleAvatarSelection = (index) => {
    setSelectedAvatar(index);
    setFormData({
      ...formData,
      profileImage: AVATAR_OPTIONS[index]
    });
  };

  // Handle basic profile update (username, bio, avatar)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data to send to the server
      const updateData = new FormData();
      
      // Only append text fields that exist
      updateData.append('username', formData.username);
      
      // Only include bio if it's defined
      if (formData.bio !== undefined) {
        updateData.append('bio', formData.bio);
      }

      // Add selected avatar's URL
      if (selectedAvatar !== null && selectedAvatar >= 0) {
        updateData.append('profileImage', AVATAR_OPTIONS[selectedAvatar]);
      }
      
      console.log("Form data being sent (entries):", Array.from(updateData.entries()));
      
      // Send update request
      const response = await userService.updateUserProfile(updateData);
      console.log("Update response:", response);
      
      setSuccess('Profils veiksmīgi atjaunināts!');
      
      // Auto-hide success message after 3 seconds and navigate back
      setTimeout(() => {
        setSuccess(null);
        // After successful update, navigate back to user profile
        if (user) {
          setCurrentPage('user-profile', user.id);
        } else {
          setCurrentPage('dashboard');
        }
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Kļūda atjaunojot profilu. Lūdzu, mēģiniet vēlreiz.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate password fields
    if (!formData.currentPassword) {
      setError('Lūdzu, ievadiet pašreizējo paroli');
      return;
    }
    
    if (!formData.newPassword) {
      setError('Lūdzu, ievadiet jauno paroli');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Jaunai parolei jābūt vismaz 8 simbolus garai');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Paroles nesakrīt');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create API service if not exists
      await userService.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccess('Parole veiksmīgi atjaunināta!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Kļūda atjaunojot paroli. Pārbaudiet pašreizējo paroli un mēģiniet vēlreiz.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle navigation back to profile
  const navigateToProfile = () => {
    if (user) {
      setCurrentPage('user-profile', user.id);
    } else {
      setCurrentPage('dashboard');
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Ielāde...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="profile-navigation">
          <button className="btn btn-outline back-btn" onClick={navigateToProfile}>
            &larr; Atpakaļ uz profilu
          </button>
        </div>
        
        <div className="profile-edit-container">
          <h2>Rediģēt profilu</h2>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)} className="close-button">×</button>
            </div>
          )}
          
          {success && (
            <div className="success-message">
              {success}
              <button onClick={() => setSuccess(null)} className="close-button">×</button>
            </div>
          )}
          
          {/* Tab navigation */}
          <div className="profile-edit-tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profila informācija
            </button>
            <button 
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Mainīt paroli
            </button>
          </div>
          
          {/* Profile information tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-edit-form" encType="multipart/form-data">
              <div className="form-section">
                <h3>Profila informācija</h3>
                
                <div className="form-group">
                  <label htmlFor="username">Lietotājvārds</label>
                  <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">E-pasts</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    className="form-control"
                    disabled // Email cannot be changed
                  />
                  <small className="form-text">E-pasta adresi nevar mainīt</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Par mani</label>
                  <textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    className="form-control"
                    rows={4}
                    placeholder="Pastāstiet par sevi..."
                  ></textarea>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Izvēlieties profila attēlu</h3>
                
                <div className="avatar-selection-grid">
                  {AVATAR_OPTIONS.map((avatar, index) => (
                    <div 
                      key={index}
                      className={`avatar-option ${selectedAvatar === index ? 'selected' : ''}`}
                      onClick={() => handleAvatarSelection(index)}
                    >
                      <img 
                        src={avatar}
                        alt={`Avatar option ${index + 1}`}
                        className="avatar-preview"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={navigateToProfile}
                  disabled={isSaving}
                >
                  Atcelt
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saglabā...' : 'Saglabāt profilu'}
                </button>
              </div>
            </form>
          )}
          
          {/* Password change tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordUpdate} className="profile-edit-form">
              <div className="form-section">
                <h3>Paroles maiņa</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Pašreizējā parole</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">Jaunā parole</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    className="form-control"
                    required
                    minLength="8"
                  />
                  <small className="form-text">Parolei jābūt vismaz 8 simbolus garai</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Apstiprināt jauno paroli</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    className="form-control"
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={navigateToProfile}
                  disabled={isSaving}
                >
                  Atcelt
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Atjaunina...' : 'Atjaunināt paroli'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileEditPage;