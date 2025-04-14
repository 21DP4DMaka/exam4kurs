import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './UserProfilePage.css';
import './ProfileEditPage.css';
import { authService, userService } from '../services/api';

function ProfileEditPage({ setCurrentPage }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    workplace: '',
    profileImage: '' 
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        const userData = response.data.user;
        setUser(userData);
        
        // Set initial form data from user profile
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.bio || '',
          workplace: userData.ProfessionalProfile?.workplace || '',
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
    console.log(`Field ${name} changed to: ${value}`);
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file.name, file.type, file.size);
      setAvatar(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data to send to the server
      const updateData = new FormData();
      updateData.append('username', formData.username);
      updateData.append('bio', formData.bio || '');

      // Only include workplace field for professionals
      if (user.role === 'power' || user.role === 'admin') {
        updateData.append('professionalData', JSON.stringify({ 
          workplace: formData.workplace || '' 
        }));
      }

      // Add avatar if selected
      if (avatar) {
        updateData.append('profileImage', avatar);
        console.log('Adding profile image to form data:', avatar.name);
      }
      
      console.log('Submitting profile update with data:', {
        username: formData.username,
        bio: formData.bio,
        workplace: formData.workplace,
        hasAvatar: !!avatar
      });
      
      // Send update request
      const response = await userService.updateUserProfile(updateData);
      
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
          
          <form onSubmit={handleSubmit} className="profile-edit-form" encType="multipart/form-data">
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
            </div>ф
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileEditPage;