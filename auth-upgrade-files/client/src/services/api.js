// All backend calls live here, so pages stay simple.
import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

// ---- login token: kept in the browser so the user stays logged in after a page refresh
const TOKEN_KEY = 'hospital_token';
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Automatically attach the token to every request
http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says "not logged in" (expired token), send the user to the login page
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      clearToken();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const loginUser = (email, password) => http.post('/auth/login', { email, password }).then((r) => r.data);
export const registerUser = (data) => http.post('/auth/register', data).then((r) => r.data);
export const getMe = () => http.get('/auth/me').then((r) => r.data);

// Turns any Axios error into a friendly message string
export const errMsg = (e) =>
  e.response?.data?.message ||
  (e.request ? 'Cannot reach the server. Is the backend running on port 5000?' : e.message);

export const getDoctors = (params = {}) => http.get('/doctors', { params }).then((r) => r.data);
export const getDoctor = (id) => http.get(`/doctors/${id}`).then((r) => r.data);
export const getAllDoctors = () => http.get('/doctors/all').then((r) => r.data); // admin only
export const addDoctor = (data) => http.post('/doctors', data).then((r) => r.data);
export const updateDoctor = (id, data) => http.put(`/doctors/${id}`, data).then((r) => r.data);
export const deactivateDoctor = (id) => http.delete(`/doctors/${id}`).then((r) => r.data);

export const getDepartments = () => http.get('/departments').then((r) => r.data);
export const getStats = () => http.get('/stats').then((r) => r.data);

export const getSlots = (doctorId, date) => http.get('/appointments/slots', { params: { doctorId, date } }).then((r) => r.data);
export const bookAppointment = (data) => http.post('/appointments', data).then((r) => r.data);
export const getAppointments = (params = {}) => http.get('/appointments', { params }).then((r) => r.data);
export const cancelAppointment = (id) => http.patch(`/appointments/${id}/cancel`).then((r) => r.data);
export const setAppointmentStatus = (id, status) => http.patch(`/appointments/${id}/status`, { status }).then((r) => r.data);
