import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './TagApplications.css';
import { authService, tagService } from '../services/api';

function AdminTagApplicationsPage() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingAppId, setReviewingAppId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'

  // Ielādēt datus
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data.user);

        // Pārbaudīt vai lietotājs ir administrators
        if (userResponse.data.user.role !== 'admin') {
          setError('Tikai administratoriem ir atļauts piekļūt šai lapai.');
          setIsLoading(false);
          return;
        }

        // Ielādēt tagus
        const tagsResponse = await tagService.getTags();
        setTags(tagsResponse.data);

        // Ielādēt pieteikumus
        await loadApplications();

        setIsLoading(false);
      } catch (error) {
        console.error('Kļūda ielādējot datus:', error);
        setError('Neizdevās ielādēt datus. Lūdzu, mēģiniet vēlreiz.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Ielādēt pieteikumus atkarībā no filtra
  const loadApplications = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await tagService.getTagApplications(params);
      setApplications(response.data);
    } catch (error) {
      console.error('Kļūda ielādējot pieteikumus:', error);
      setError('Neizdevās ielādēt pieteikumus. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  // Apstrādāt filtra maiņu
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    setIsLoading(true);
    try {
      const params = newFilter !== 'all' ? { status: newFilter } : {};
      const response = await tagService.getTagApplications(params);
      setApplications(response.data);
    } catch (error) {
      console.error('Kļūda ielādējot pieteikumus:', error);
      setError('Neizdevās ielādēt pieteikumus. Lūdzu, mēģiniet vēlreiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Atvērt pārskatīšanas modālo logu
  const openReviewModal = (applicationId, action) => {
    setReviewingAppId(applicationId);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  // Aizvērt pārskatīšanas modālo logu
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewingAppId(null);
    setReviewAction('');
    setReviewNotes('');
  };

  // Apstrādāt pieteikuma pārskatīšanu
  const handleReviewSubmit = async () => {
    if (!reviewingAppId) return;

    try {
      setIsLoading(true);
      await tagService.reviewTagApplication(reviewingAppId, {
        status: reviewAction,
        notes: reviewNotes
      });

      setSuccess(`Pieteikums veiksmīgi ${reviewAction === 'approved' ? 'apstiprināts' : 'noraidīts'}!`);
      await loadApplications();
      closeReviewModal();
    } catch (error) {
      console.error(`Kļūda ${reviewAction === 'approved' ? 'apstiprinot' : 'noraidot'} pieteikumu:`, error);
      setError(`Neizdevās ${reviewAction === 'approved' ? 'apstiprināt' : 'noraidīt'} pieteikumu. Lūdzu, mēģiniet vēlreiz.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Iegūt taga nosaukumu pēc ID
  const getTagNameById = (tagId) => {
    const tag = tags.find(tag => tag.id === tagId);
    return tag ? tag.name : 'Nezināms tags';
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
  
  // Pārbaudīt vai lietotājs ir administrators
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
        <h2>Tagu pieteikumu administrēšana</h2>
        
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
        
        <div className="filter-controls">
          <button 
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => handleFilterChange('pending')}
          >
            Gaidoši
          </button>
          <button 
            className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => handleFilterChange('approved')}
          >
            Apstiprināti
          </button>
          <button 
            className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => handleFilterChange('rejected')}
          >
            Noraidīti
          </button>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => handleFilterChange('all')}
          >
            Visi
          </button>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              Tagu pieteikumi 
              {filter === 'pending' && ' - Gaidoši'}
              {filter === 'approved' && ' - Apstiprināti'}
              {filter === 'rejected' && ' - Noraidīti'}
              {filter === 'all' && ' - Visi'}
            </h3>
          </div>
          <div className="card-content">
            {applications.length > 0 ? (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Lietotājs</th>
                    <th>Tags</th>
                    <th>Iesniegšanas datums</th>
                    <th>Statuss</th>
                    <th>Izskatīšanas datums</th>
                    <th>Piezīmes</th>
                    <th>Dokuments</th>
                    <th>Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className={`status-${application.status}`}>
                      <td>{application.User ? application.User.username : 'Nezināms'}</td>
                      <td>{getTagNameById(application.tagId)}</td>
                      <td>{formatDate(application.createdAt)}</td>
                      <td>
                        {application.status === 'pending' && 'Gaida izskatīšanu'}
                        {application.status === 'approved' && 'Apstiprināts'}
                        {application.status === 'rejected' && 'Noraidīts'}
                      </td>
                      <td>{formatDate(application.reviewedAt)}</td>
                      <td>{application.notes || '-'}</td>
                      <td>
                        <a 
                          href={`http://localhost:5000/api/tag-applications/${application.id}/document`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
                        >
                          Lejupielādēt
                        </a>
                      </td>
                      <td>
                        {application.status === 'pending' && (
                          <div className="action-buttons">
                            <button 
                              onClick={() => openReviewModal(application.id, 'approved')} 
                              className="btn btn-sm btn-success"
                            >
                              Apstiprināt
                            </button>
                            <button 
                              onClick={() => openReviewModal(application.id, 'rejected')} 
                              className="btn btn-sm btn-danger"
                            >
                              Noraidīt
                            </button>
                          </div>
                        )}
                        {application.status !== 'pending' && (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">Nav atrasti pieteikumi ar izvēlēto filtru.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pārskatīšanas modālais logs */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{reviewAction === 'approved' ? 'Apstiprināt' : 'Noraidīt'} pieteikumu</h3>
            
            <div className="form-group">
              <label htmlFor="reviewNotes">Piezīmes (neobligāti):</label>
              <textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={reviewAction === 'approved' 
                  ? 'Pievienojiet komentāru par apstiprinājumu (neobligāti)' 
                  : 'Norādiet iemeslu noraidījumam (ieteicams)'}
                className="form-control"
                rows={4}
              />
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={handleReviewSubmit} 
                className={`btn ${reviewAction === 'approved' ? 'btn-success' : 'btn-danger'}`}
                disabled={isLoading}
              >
                {isLoading ? 'Apstrādā...' : (reviewAction === 'approved' ? 'Apstiprināt' : 'Noraidīt')}
              </button>
              <button 
                onClick={closeReviewModal} 
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

export default AdminTagApplicationsPage;