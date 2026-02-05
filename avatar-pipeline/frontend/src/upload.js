import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
  return response.data;
};

export const listJobs = async () => {
  const response = await axios.get(`${API_BASE_URL}/jobs`);
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await axios.delete(`${API_BASE_URL}/job/${jobId}`);
  return response.data;
};

export const downloadModel = async (modelUrl) => {
  const response = await axios.get(`${API_BASE_URL}${modelUrl}`, {
    responseType: 'blob',
  });
  
  return response.data;
};

