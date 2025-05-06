import React, { useState } from 'react';
import './AttachmentsViewer.css';

const AttachmentsViewer = ({ attachments, questionAttachmentService }) => {
  const [expandedAttachment, setExpandedAttachment] = useState(null);

  // Handle clicking on an attachment to expand/preview it
  const handleAttachmentClick = (attachment) => {
    if (expandedAttachment && expandedAttachment.id === attachment.id) {
      // If already expanded, collapse it
      setExpandedAttachment(null);
    } else {
      // Otherwise, expand it
      setExpandedAttachment(attachment);
    }
  };

  // Handle downloading the attachment
  const handleDownload = (attachment, e) => {
    e.stopPropagation(); // Prevent the click from triggering the parent handler
    
    const downloadUrl = questionAttachmentService.downloadAttachment(attachment.id);
    
    // Create a temporary anchor element to initiate the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', attachment.originalname || attachment.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle opening the PDF in a new tab
  const handleOpenPdf = (attachment, e) => {
    e.stopPropagation(); // Prevent the click from triggering the parent handler
    const pdfUrl = questionAttachmentService.downloadAttachment(attachment.id);
    window.open(pdfUrl, '_blank');
  };

  // Format file size
  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="attachments-viewer">
      {attachments && attachments.length > 0 ? (
        <>
          <h4 className="attachments-title">Pielikumi ({attachments.length})</h4>
          <div className="attachments-list">
            {attachments.map(attachment => (
              <div 
                key={attachment.id} 
                className={`attachment-item ${expandedAttachment && expandedAttachment.id === attachment.id ? 'expanded' : ''}`}
                onClick={() => handleAttachmentClick(attachment)}
              >
                <div className="attachment-header">
                  <div className="attachment-info">
                    <span className="attachment-icon">
                      {attachment.mimetype === 'application/pdf' ? '📄' : '🖼️'}
                    </span>
                    <span className="attachment-name">{attachment.originalname || attachment.filename}</span>
                    <span className="attachment-size">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                  <div className="attachment-actions">
                    <button
                      className="attachment-download-btn"
                      onClick={(e) => handleDownload(attachment, e)}
                      title="Lejupielādēt failu"
                    >
                      ⬇️
                    </button>
                    <button
                      className="attachment-expand-btn"
                      title={expandedAttachment && expandedAttachment.id === attachment.id ? "Aizvērt priekšskatījumu" : "Atvērt priekšskatījumu"}
                    >
                      {expandedAttachment && expandedAttachment.id === attachment.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                
                {expandedAttachment && expandedAttachment.id === attachment.id && (
                  <div className="attachment-preview">
                    {attachment.mimetype === 'application/pdf' ? (
                      <div className="pdf-preview">
                        <div className="pdf-icon">📄</div>
                        <div className="pdf-info">
                          <h5 className="pdf-name">{attachment.originalname || attachment.filename}</h5>
                          <p className="pdf-description">PDF failu ({formatFileSize(attachment.size)})</p>
                          <div className="pdf-actions">
                            <button 
                              className="btn btn-primary pdf-view-btn"
                              onClick={(e) => handleOpenPdf(attachment, e)}
                            >
                              Atvērt PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : attachment.mimetype.startsWith('image/') ? (
                      <img 
                        src={questionAttachmentService.downloadAttachment(attachment.id)} 
                        alt={attachment.originalname || attachment.filename}
                        className="attachment-image"
                      />
                    ) : (
                      <div className="preview-not-available">
                        Priekšskatījums nav pieejams šim faila tipam
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AttachmentsViewer;