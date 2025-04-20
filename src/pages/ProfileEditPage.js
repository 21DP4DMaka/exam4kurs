// src/pages/ProfileEditPage.js - Fixed version with proper form handling
import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './UserProfilePage.css';
import './ProfileEditPage.css';
import { authService, userService } from '../services/api';

function ProfileEditPage({ setCurrentPage }) {
  // User data state
  const [user, setUser] = useState(null);
  
  // Form data state with password fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    workplace: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: '' 
  });
  
  // UI state
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
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
          workplace: userData.ProfessionalProfile?.workplace || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImage: userData.profileImage || ''
        });
        
        // Set preview image if user has a profile image
        if (userData.profileImage) {
          setPreviewUrl(userData.profileImage);
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

  // Handle avatar file selection - FIXED VERSION
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG)');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must not exceed 2MB');
        return;
      }
      
      setAvatar(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError(null);
    }
  };

  // Handle basic profile update (username, bio, avatar) - FIXED VERSION
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data to send to the server - MAKE SURE THIS IS FormData!
      const updateData = new FormData();
      
      // Only append text fields that exist
      updateData.append('username', formData.username);
      
      // Only include bio if it's defined
      if (formData.bio !== undefined) {
        updateData.append('bio', formData.bio);
      }

      // Only include workplace for professionals
      if (user.role === 'power' || user.role === 'admin') {
        // IMPORTANT: Converting object to JSON string properly
        const professionalData = JSON.stringify({ 
          workplace: formData.workplace || '' 
        });
        
        updateData.append('professionalData', professionalData);
        console.log("Added professional data:", professionalData);
      }

      // Add avatar only if selected
      if (avatar) {
        updateData.append('profileImage', avatar);
        console.log("Added avatar:", avatar.name, avatar.type, avatar.size);
      }
      
      console.log("Form data being sent (entries):", Array.from(updateData.entries()));
      
      // Send update request
      const response = await userService.updateUserProfile(updateData);
      console.log("Update response:", response);
      
      setSuccess('Profile updated successfully!');
      
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
        setError('Error updating profile. Please try again.');
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
                
                {(user.role === 'power' || user.role === 'admin') && (
                  <div className="form-group">
                    <label htmlFor="workplace">Darba vieta</label>
                    <input 
                      type="text" 
                      id="workplace" 
                      name="workplace" 
                      value={formData.workplace} 
                      onChange={handleChange} 
                      className="form-control"
                      placeholder="Jūsu darba vieta vai uzņēmums"
                    />
                  </div>
                )}
              </div>
              
              <div className="form-section">
                <h3>Profila attēls</h3>
                
                <div className="avatar-upload-container">
                  <div className="current-avatar">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profila attēls" 
                        className="avatar-preview"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <span>Nav attēla</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="avatar-upload">
                    <input 
                      type="file" 
                      id="avatarUpload" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      className="file-input"
                    />
                    <label htmlFor="avatarUpload" className="file-upload-btn">
                      Izvēlēties attēlu
                    </label>
                    <small className="form-text">
                      Atbalstītie formāti: JPG, PNG. Maksimālais izmērs: 2MB
                    </small>
                  </div>
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