const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',
  TIMEOUT: 15000,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
};

export default API_CONFIG;
