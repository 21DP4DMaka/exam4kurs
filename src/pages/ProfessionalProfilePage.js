import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './TagApplications.css';
import { authService, tagService } from '../services/api';
import TagApplicationModal from '../components/TagApplicationModal';
import ApplicationButton from '../components/ApplicationButton';

function ProfessionalProfilePage() {
  const [user, setUser] = useState(null);
  const [userTags, setUserTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [applications, setApplications] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Получение токена для URL
  const getDocumentUrl = (applicationId) => {
    const token = localStorage.getItem('token');
    return `http://localhost:5000/api/tag-applications/${applicationId}/document?token=${token}`;
  };

  // Ielādēt lietotāja datus un tagus
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data.user);
        
        // Отладочная информация
        console.log('Пользователь:', userResponse.data.user);
        if (userResponse.data.user.ProfessionalProfile) {
          console.log('Профессиональный профиль:', userResponse.data.user.ProfessionalProfile);
        }

        // Ielādēt visus tagus
        const tagsResponse = await tagService.getTags();
        setAvailableTags(tagsResponse.data);
        
        // Ielādēt lietotāja tagu pieteikumus
        if (userResponse.data.user && userResponse.data.user.id) {
          const applicationsResponse = await tagService.getUserTagApplications();
          setApplications(applicationsResponse.data);
          
          // Загрузить профессиональные теги пользователя
          try {
            // Получаем теги профессионального профиля
            const userTagsResponse = await tagService.getUserProfessionalTags(userResponse.data.user.id);
            if (userTagsResponse.data && Array.isArray(userTagsResponse.data)) {
              setUserTags(userTagsResponse.data);
            }
          } catch (tagError) {
            console.error('Ошибка загрузки тегов профиля:', tagError);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Kļūda ielādējot datus:', error);
        setError('Neizdevās ielādēt profila datus. Lūdzu, mēģiniet vēlreiz.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open modal
  const handleOpenModal = () => {
    // Ja nav pieejamu tagu, parādām paziņojumu, nevis modālo logu
    if (availableTagsForApplication.length === 0) {
      setSuccess("Pašlaik nav pieejamu kategoriju pieteikumu iesniegšanai. Visas kategorijas jau ir apstiprinātas vai gaida izskatīšanu.");
    } else {
      setIsModalOpen(true);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle successful application submission
  const handleApplicationSuccess = async (successMessage) => {
    setSuccess(successMessage);
    
    // Reload applications data
    try {
      const applicationsResponse = await tagService.getUserTagApplications();
      setApplications(applicationsResponse.data);
      
      // Обновляем также теги пользователя (на случай если они изменились)
      if (user && user.id) {
        const userTagsResponse = await tagService.getUserProfessionalTags(user.id);
        if (userTagsResponse.data && Array.isArray(userTagsResponse.data)) {
          setUserTags(userTagsResponse.data);
        }
      }
    } catch (error) {
      console.error('Kļūda atjaunojot pieteikumu sarakstu:', error);
    }
  };

  // Iegūt taga nosaukumu pēc ID
  const getTagNameById = (tagId) => {
    const tag = availableTags.find(tag => tag.id === tagId);
    return tag ? tag.name : 'Nezināma kategorija';
  };

  // Iegūt tagus, kuri vēl nav apstiprināti vai pieteikti
  const getAvailableTagsForApplication = () => {
    // Get IDs of all user's tags and pending applications
    const userTagIds = userTags.map(tag => tag.id);
    const pendingTagIds = applications
      .filter(app => app.status === 'pending')
      .map(app => app.tagId);
    
    // Filter out tags that user already has or has pending applications for
    return availableTags.filter(tag => 
      !userTagIds.includes(tag.id) && 
      !pendingTagIds.includes(tag.id)
    );
  };

  // Formatē statusu cilvēkiem saprotamā formā
  const formatStatus = (status) => {
    switch(status) {
      case 'pending':
        return 'Gaida izskatīšanu';
      case 'approved':
        return 'Apstiprināts';
      case 'rejected':
        return 'Noraidīts';
      default:
        return 'Nezināms statuss';
    }
  };

  // Formatē datumu
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <div className="loading-spinner">Ielāde...</div>;
  if (error && !user) return <div className="error-message">{error}</div>;
  
  // Pārbaudīt vai lietotājs ir profesionālis
  if (user && user.role !== 'power' && user.role !== 'admin') {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="auth-card">
            <h2>Piekļuve liegta</h2>
            <p>Šī sadaļa ir pieejama tikai profesionāļiem un administratoriem.</p>
          </div>
        </div>
      </div>
    );
  }

  // Iegūt tagus, kuri pieejami pieteikumam
  const availableTagsForApplication = getAvailableTagsForApplication();

  return (
    <div className="dashboard-page">
      <div className="container">
        <h2>Profesionālais profils</h2>
        
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
        
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Jūsu profesionālie tagi</h3>
          </div>
          <div className="card-content">
            {userTags && userTags.length > 0 ? (
              <div className="tag-list">
                {userTags.map(tag => (
                  <span key={tag.id} className="profile-tag">{tag.name}</span>
                ))}
              </div>
            ) : (
              <p className="empty-state">Jums vēl nav apstiprinātu profesionālo tagu.</p>
            )}
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Pieteikumi profesionālajiem tagiem</h3>
            <ApplicationButton 
              onClick={handleOpenModal}
              disabled={availableTagsForApplication.length === 0}
            />
          </div>
          <div className="card-content">
            {applications.length > 0 ? (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Kategorija</th>
                    <th>Iesniegšanas datums</th>
                    <th>Statuss</th>
                    <th>Izskatīšanas datums</th>
                    <th>Piezīmes</th>
                    <th>Dokuments</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className={`status-${application.status}`}>
                      <td>{getTagNameById(application.tagId)}</td>
                      <td>{formatDate(application.createdAt)}</td>
                      <td>{formatStatus(application.status)}</td>
                      <td>{application.reviewedAt ? formatDate(application.reviewedAt) : '-'}</td>
                      <td>{application.notes || '-'}</td>
                      <td>
                        <a 
                          href={getDocumentUrl(application.id)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
                        >
                          Skatīt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Jums vēl nav iesniegtu pieteikumu profesionālajiem tagiem.</p>
            )}
            
            {availableTagsForApplication.length === 0 && applications.length > 0 && (
              <p className="info-message" style={{marginTop: '20px'}}>
                Pašlaik nav pieejamu kategoriju pieteikumu iesniegšanai. Visas kategorijas jau ir apstiprinātas vai gaida izskatīšanu.
              </p>
            )}
          </div>
        </div>
        
        {/* Modal for tag application */}
        <TagApplicationModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleApplicationSuccess}
          availableTags={availableTagsForApplication}
        />
      </div>
    </div>
  );
}

export default ProfessionalProfilePage;