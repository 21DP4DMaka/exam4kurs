import React from 'react';

const ProfileButton = ({ onClick }) => {
  return (
    <button 
      className="profile-button"
      onClick={onClick}
      style={{
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
    >
      <span style={{ marginRight: '8px' }}>👤</span>
      Skatīt manu profilu
    </button>
  );
};

export default ProfileButton;