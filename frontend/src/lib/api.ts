import axios from 'axios';

// Load base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create a pre-configured Axios instance for API calls
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token from localStorage to every request (if available)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Global response handler for auth-related errors (401/403)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response) {
            const { status } = error.response;

            if (status === 401 || status === 403) {
                console.warn(`API Error: ${status} - Token expired or invalid.`);

                // Trigger centralized logout/session expiry handler if available
                if (typeof window !== 'undefined' && (window as any).triggerSessionExpired) {
                    (window as any).triggerSessionExpired("Your session has expired. Please log in again.");
                } else {
                    // Fallback logout logic
                    localStorage.removeItem('veriwrite_user');
                    localStorage.removeItem('token');
                    window.location.href = '/auth';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
