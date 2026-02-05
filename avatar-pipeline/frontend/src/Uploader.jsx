import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const UploadContainer = styled.div`
  border: 2px dashed #ddd;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #667eea;
    background-color: #f8f9ff;
  }
  
  &.dragover {
    border-color: #667eea;
    background-color: #f0f4ff;
    transform: scale(1.02);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  color: #ddd;
  margin-bottom: 15px;
`;

const UploadText = styled.p`
  margin: 0 0 10px 0;
  color: #666;
  font-size: 1.1rem;
`;

const UploadSubtext = styled.p`
  margin: 0;
  color: #999;
  font-size: 0.9rem;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 20px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const PreviewImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  margin: 20px 0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #ffcdd2;
`;

const SuccessMessage = styled.div`
  background: #e8f5e8;
  color: #2e7d32;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #c8e6c9;
`;

const NewUploadButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 15px;
  
  &:hover {
    background: #5a6268;
  }
`;

function Uploader({ onUploadSuccess, onNewUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    setSuccess(false);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.job_id) {
        setSuccess(true);
        onUploadSuccess(response.data);
      } else {
        throw new Error('Upload failed');
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleNewUpload = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onNewUpload();
  };

  return (
    <div>
      {!preview ? (
        <UploadContainer
          className={dragActive ? 'dragover' : ''}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon>📷</UploadIcon>
          <UploadText>Drop your image here or click to browse</UploadText>
          <UploadSubtext>Supports JPG, PNG, and other image formats</UploadSubtext>
          
          <FileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <UploadButton disabled={uploading}>
            {uploading ? 'Uploading...' : 'Choose File'}
          </UploadButton>
        </UploadContainer>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <PreviewImage src={preview} alt="Preview" />
          <div>
            <UploadButton disabled={uploading}>
              {uploading ? 'Processing...' : 'Generate Avatar'}
            </UploadButton>
            <br />
            <NewUploadButton onClick={handleNewUpload}>
              Upload Different Image
            </NewUploadButton>
          </div>
        </div>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && (
        <SuccessMessage>
          ✅ Image uploaded successfully! Processing your 3D avatar...
        </SuccessMessage>
      )}
    </div>
  );
}

export default Uploader;
