import React, { useState } from 'react';
import './AuthPages.css';
import { authService } from '../services/api';

function RegisterPage({ onRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    role: 'regular' // 'regular' vai 'professional'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Notīrīt kļūdu, kad lietotājs sāk labot lauku
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Улучшенная функция валидации в RegisterPage.js

const validate = () => {
  const newErrors = {};
  
  if (!formData.username) {
    newErrors.username = 'Lietotājvārds ir obligāts';
  } else if (formData.username.length < 3) {
    newErrors.username = 'Lietotājvārdam jābūt vismaz 3 simbolus garam';
  }
  
  if (!formData.email) {
    newErrors.email = 'E-pasts ir obligāts';
  } else {
    // Улучшенная валидация email с использованием более строгого регулярного выражения
    // Это выражение проверяет наличие правильного домена верхнего уровня и другие требования
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ievadiet derīgu e-pasta adresi (piemēram, vards@domens.com)';
    }
  }
  
  if (!formData.password) {
    newErrors.password = 'Parole ir obligāta';
  } else if (formData.password.length < 8) {
    newErrors.password = 'Parolei jābūt vismaz 8 simbolus garai';
  }
  
  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Paroles nesakrīt';
  }
  
  if (!formData.agreeTerms) {
    newErrors.agreeTerms = 'Jums jāpiekrīt noteikumiem un nosacījumiem';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setIsLoading(true);
      setServerError('');
      
      try {
        // Sagatavot datus API pieprasījumam
        const userData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        
        // Izsaukt reģistrācijas API
        const response = await authService.register(userData);
        
        // Saglabāt tokenu local storage
        localStorage.setItem('token', response.data.token);
        
        // Izsaukt onRegister funkciju, lai pārietu uz instrumentu paneli
        onRegister && onRegister();
      } catch (error) {
        // Apstrādāt kļūdas
        if (error.response && error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else {
          setServerError('Kļūda reģistrācijas laikā. Lūdzu, mēģiniet vēlreiz.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Izveidot jaunu kontu</h2>
          <p className="auth-subtitle">Aizpildiet formu, lai reģistrētos platformā</p>
          
          {serverError && <div className="server-error">{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Lietotājvārds</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Izvēlieties lietotājvārdu"
                className={errors.username ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">E-pasta adrese</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jusu.epasts@piemers.lv"
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Parole</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Izveidojiet jaunu paroli"
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Apstiprināt paroli</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ievadiet paroli vēlreiz"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
            
            <div className="form-group">
              <label>Konta tips</label>
              <div className="role-options">
                <div className="role-option">
                  <input
                    type="radio"
                    id="regularUser"
                    name="role"
                    value="regular"
                    checked={formData.role === 'regular'}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <label htmlFor="regularUser">
                    <strong>Parasts lietotājs</strong>
                    <p>Uzdodiet jautājumus un saņemiet atbildes</p>
                  </label>
                </div>
                
                <div className="role-option">
                  <input
                    type="radio"
                    id="professionalUser"
                    name="role"
                    value="professional"
                    checked={formData.role === 'professional'}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <label htmlFor="professionalUser">
                    <strong>Profesionālis</strong>
                    <p>Sniedziet atbildes un konsultācijas</p>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-group agree-terms">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className={errors.agreeTerms ? 'error' : ''}
                disabled={isLoading}
              />
              <label htmlFor="agreeTerms">
                Es piekrītu <a href="/terms">lietošanas noteikumiem</a> un <a href="/privacy">privātuma politikai</a>
              </label>
              {errors.agreeTerms && <div className="error-message">{errors.agreeTerms}</div>}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? 'Notiek reģistrācija...' : 'Reģistrēties'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Jau ir konts? <a href="/login">Pieslēgties</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;