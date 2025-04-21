// Additional component that can be included in src/components/AvatarSelection.js
import React from 'react';

// Predefined avatar options (these can be imported from a constants file)
const AVATAR_OPTIONS = [
  "https://www.sostav.ru/images/news/2019/04/10/ayrrrjh4.jpg",
  "https://via.placeholder.com/100/e74c3c/FFFFFF?text=2",
  "https://via.placeholder.com/100/2ecc71/FFFFFF?text=3",
  "https://via.placeholder.com/100/f39c12/FFFFFF?text=4",
  "https://via.placeholder.com/100/9b59b6/FFFFFF?text=5",
  "https://via.placeholder.com/100/34495e/FFFFFF?text=6",
  "https://via.placeholder.com/100/1abc9c/FFFFFF?text=7",
  "https://via.placeholder.com/100/95a5a6/FFFFFF?text=8"
];

function AvatarSelection({ selectedAvatar, onSelectAvatar }) {
  return (
    <div className="avatar-selection-container">
      <label className="avatar-label">Choose your profile picture:</label>
      <div className="avatar-selection-grid">
        {AVATAR_OPTIONS.map((avatar, index) => (
          <div 
            key={index}
            className={`avatar-option ${selectedAvatar === index ? 'selected' : ''}`}
            onClick={() => onSelectAvatar(index)}
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
  );
}

export default AvatarSelection;