import axios from 'axios';
import { Apidomain } from '../utils/ApiDomain';
 

const api = axios.create({
  baseURL: Apidomain,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Clear local storage and reload on unauthorized
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error.response);
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        data: { message: 'No response from server. Please try again.' }
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        data: { message: 'Error setting up request. Please try again.' }
      });
    }
  }
);

export default api;
