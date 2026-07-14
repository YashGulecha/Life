import axios from 'axios';

// Detect if we are running in a Capacitor / Native mobile container
const isNative = window.location.protocol === 'file:' || 
                 window.location.hostname === 'localhost' && window.location.port === '' ||
                 window.location.href.includes('capacitor://');

const API_BASE_URL = isNative 
  ? 'https://life.yashgulecha.in/api' 
  : '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending/receiving HttpOnly cookies in web mode
});

// Request interceptor to append JWT token in Authorization header for Capacitor/native shell
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch 401 Unauthorized errors and force logout
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hasToken = !!localStorage.getItem('access_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      
      // Only reload to force the login screen if the user was previously logged in
      if (hasToken) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default client;
