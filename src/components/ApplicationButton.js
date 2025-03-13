import React from 'react';
import './ApplicationButton.css';

function ApplicationButton({ onClick, disabled }) {
  // Making sure the click event is properly registered
  const handleClick = (event) => {
    // Prevent any default behavior
    event.preventDefault();
    // Ensure onClick is only called if the button is not disabled
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <button 
      className="application-button"
      onClick={handleClick}
      type="button"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      Iesniegt pieteikumu
    </button>
  );
}

export default ApplicationButton;