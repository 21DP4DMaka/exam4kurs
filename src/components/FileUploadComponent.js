import React, { useState } from 'react';
import './FileUploadComponent.css';

const FileUploadComponent = ({ onFilesChange, maxFiles = 2 }) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newErrors = [];
    let validFiles = [...files];

    // Check if we'll exceed the maximum number of files
    if (files.length + selectedFiles.length > maxFiles) {
      newErrors.push(`Nevar pievienot vairāk nekā ${maxFiles} failus.`);
      return;
    }

    // Validate each file
    selectedFiles.forEach(file => {
      // Check file type
      const fileType = file.type;
      if (!(fileType === 'application/pdf' || fileType.startsWith('image/png'))) {
        newErrors.push(`Fails "${file.name}" nav derīgs. Atļauti tikai PDF vai PNG faili.`);
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        newErrors.push(`Fails "${file.name}" ir pārāk liels. Maksimālais faila izmērs ir 5MB.`);
        return;
      }

      // If the file passes all checks, add it to the array
      validFiles.push(file);
    });

    // Update state
    setFiles(validFiles);
    setErrors(newErrors);
    onFilesChange(validFiles);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="file-upload-component">
      <div className="file-upload-area">
        <input
          type="file"
          id="file-upload"
          className="file-input"
          accept=".pdf,.png"
          onChange={handleFileChange}
          multiple={maxFiles > 1}
          disabled={files.length >= maxFiles}
        />
        <label htmlFor="file-upload" className="file-upload-label">
          <span className="upload-icon">📎</span>
          <span className="upload-text">
            {files.length < maxFiles 
              ? 'Izvēlieties PDF vai PNG failus (max 5MB)' 
              : 'Sasniegts maksimālais failu skaits'}
          </span>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="file-upload-errors">
          {errors.map((error, index) => (
            <p key={index} className="file-error">{error}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          <h4>Pievienotie faili:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <span className="file-icon">
                  {file.type === 'application/pdf' ? '📄' : '🖼️'}
                </span>
                <span className="file-name" title={file.name}>
                  {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                </span>
                <span className="file-size">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <small className="file-help-text">
        Pievienojiet līdz {maxFiles} failiem (PDF vai PNG formātā, līdz 5MB katrs)
      </small>
    </div>
  );
};

export default FileUploadComponent;