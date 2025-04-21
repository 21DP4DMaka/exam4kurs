import React from 'react';

// Исправленные пути к аватаркам
const AVATAR_OPTIONS = [
  "/images/avatars/1.jpg",
  "/images/avatars/2.png",
  "/images/avatars/3.jpeg",
  "/images/avatars/4.png",
];

function AvatarSelection({ selectedAvatar, onSelectAvatar }) {
  return (
    <div className="avatar-selection-container">
      <label className="avatar-label">Выберите изображение профиля:</label>
      <div className="avatar-selection-grid">
        {AVATAR_OPTIONS.map((avatar, index) => (
          <div 
            key={index}
            className={`avatar-option ${selectedAvatar === index ? 'selected' : ''}`}
            onClick={() => onSelectAvatar(index)}
          >
            <img 
              src={avatar}
              alt={`Вариант аватара ${index + 1}`}
              className="avatar-preview"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvatarSelection;