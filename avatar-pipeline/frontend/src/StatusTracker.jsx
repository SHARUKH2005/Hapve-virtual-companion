import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const StatusContainer = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
`;

const StatusHeader = styled.h3`
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  
  &.queued {
    background: #6c757d;
  }
  
  &.processing {
    background: #ffc107;
    animation: pulse 1.5s infinite;
  }
  
  &.finished {
    background: #28a745;
  }
  
  &.failed {
    background: #dc3545;
  }
`;

const StatusText = styled.p`
  margin: 5px 0;
  color: #666;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const StepList = styled.div`
  margin-top: 15px;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  font-size: 0.9rem;
  color: #666;
  
  &.active {
    color: #333;
    font-weight: 500;
  }
  
  &.completed {
    color: #28a745;
  }
`;

const StepIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  
  &.pending {
    background: #e9ecef;
    color: #6c757d;
  }
  
  &.active {
    background: #ffc107;
    color: white;
    animation: pulse 1.5s infinite;
  }
  
  &.completed {
    background: #28a745;
    color: white;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
  border: 1px solid #f5c6cb;
`;

const JobId = styled.div`
  font-family: monospace;
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 10px;
`;

function StatusTracker({ jobId, onJobComplete }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { key: 'queued', label: 'Job queued' },
    { key: 'preprocessing', label: 'Preprocessing image' },
    { key: '3d_generation', label: 'Generating 3D model' },
    { key: 'conversion', label: 'Converting to GLB' },
    { key: 'optimization', label: 'Optimizing for web' },
    { key: 'completed', label: 'Avatar ready!' }
  ];

  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`/status/${jobId}`);
        const jobStatus = response.data;
        setStatus(jobStatus);

        if (jobStatus.status === 'finished' || jobStatus.status === 'failed') {
          onJobComplete(jobStatus);
          return; // Stop polling
        }

        // Continue polling if still processing
        if (jobStatus.status === 'processing' || jobStatus.status === 'queued') {
          setTimeout(pollStatus, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        console.error('Status polling error:', err);
        setError('Failed to check status');
      }
    };

    // Start polling immediately
    pollStatus();
  }, [jobId, onJobComplete]);

  if (!status) {
    return null;
  }

  const getCurrentStepIndex = () => {
    if (status.status === 'failed') return -1;
    if (status.status === 'finished') return steps.length - 1;
    if (status.status === 'queued') return 0;
    if (status.step) {
      const stepIndex = steps.findIndex(step => step.key === status.step);
      return stepIndex >= 0 ? stepIndex : 0;
    }
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const progress = status.status === 'finished' ? 100 : 
                  status.status === 'failed' ? 0 : 
                  ((currentStepIndex + 1) / steps.length) * 100;

  const getStatusIcon = () => {
    switch (status.status) {
      case 'queued': return '⏳';
      case 'processing': return '⚙️';
      case 'finished': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'queued': return 'Your job is queued and will start processing soon.';
      case 'processing': return 'Processing your image to create a 3D avatar...';
      case 'finished': return 'Your 3D avatar is ready!';
      case 'failed': return 'Processing failed. Please try again.';
      default: return 'Checking status...';
    }
  };

  return (
    <StatusContainer>
      <StatusHeader>
        <StatusIcon className={status.status}>
          {getStatusIcon()}
        </StatusIcon>
        Status: {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
      </StatusHeader>
      
      <StatusText>{getStatusText()}</StatusText>
      
      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      
      <StepList>
        {steps.map((step, index) => {
          let stepClass = 'pending';
          let icon = '○';
          
          if (index < currentStepIndex) {
            stepClass = 'completed';
            icon = '✓';
          } else if (index === currentStepIndex && status.status === 'processing') {
            stepClass = 'active';
            icon = '●';
          }
          
          return (
            <StepItem key={step.key} className={stepClass}>
              <StepIcon className={stepClass}>{icon}</StepIcon>
              {step.label}
            </StepItem>
          );
        })}
      </StepList>
      
      {status.error && (
        <ErrorMessage>
          Error: {status.error}
        </ErrorMessage>
      )}
      
      <JobId>Job ID: {jobId}</JobId>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </StatusContainer>
  );
}

export default StatusTracker;

