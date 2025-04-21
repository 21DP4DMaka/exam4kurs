// src/components/AvatarSelection.js - Improved selection with default
import React from 'react';

// Avatar paths
const AVATAR_OPTIONS = [
  "/images/avatars/1.jpg",
  "/images/avatars/2.png",
  "/images/avatars/3.jpeg",
  "/images/avatars/4.png",
];

function AvatarSelection({ selectedAvatar, onSelectAvatar }) {
  // Default to first avatar (index 0) if no selection
  const currentSelection = selectedAvatar === null ? 0 : selectedAvatar;
  
  return (
    <div className="avatar-selection-container">
      <label className="avatar-label">Izvēlieties profila attēlu:</label>
      <div className="avatar-selection-grid">
        {AVATAR_OPTIONS.map((avatar, index) => (
          <div 
            key={index}
            className={`avatar-option ${currentSelection === index ? 'selected' : ''}`}
            onClick={() => onSelectAvatar(index)}
          >
            <img 
              src={avatar}
              alt={`Profila attēla variants ${index + 1}`}
              className="avatar-preview"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvatarSelection;