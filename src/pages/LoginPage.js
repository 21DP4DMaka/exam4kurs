import React, { useState } from 'react';
import './AuthPages.css';
import { authService } from '../services/api';

function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
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

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'E-pasts ir obligāts';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ievadiet derīgu e-pasta adresi';
    }
    
    if (!formData.password) {
      newErrors.password = 'Parole ir obligāta';
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
        const credentials = {
          email: formData.email,
          password: formData.password
        };
        
        // Izsaukt pieteikšanās API
        const response = await authService.login(credentials);
        
        // Saglabāt tokenu local storage
        localStorage.setItem('token', response.data.token);
        
        // Ja atzīmēts "Atcerēties mani", saglabāt lietotāja e-pastu
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Izsaukt onLogin funkciju, lai pārietu uz instrumentu paneli
        onLogin && onLogin();
      } catch (error) {
        // Apstrādāt kļūdas
        if (error.response && error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else {
          setServerError('Kļūda pieteikšanās laikā. Lūdzu, mēģiniet vēlreiz.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Pārbaudīt, vai ir saglabāts e-pasts
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prevState => ({
        ...prevState,
        email: savedEmail,
        rememberMe: true
      }));
    }
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Pieslēgties kontam</h2>
          <p className="auth-subtitle">Ievadiet savus pieslēgšanās datus, lai turpinātu</p>
          
          {serverError && <div className="server-error">{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
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
                placeholder="Ievadiet paroli"
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe">Atcerēties mani</label>
              </div>
              <a href="/forgot-password" className="forgot-password">Aizmirsu paroli</a>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? 'Notiek pieslēgšanās...' : 'Pieslēgties'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Vēl nav konta? <a href="/register">Reģistrēties</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;