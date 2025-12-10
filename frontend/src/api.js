import axios from 'axios';

const API_URL = '/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token in headers
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// Auth API
export const authAPI = {
  register: (data) => axios.post(`${API_URL}/auth/register`, data),
  login: (data) => axios.post(`${API_URL}/auth/login`, data),
  getMe: () => axios.get(`${API_URL}/auth/me`, authHeader())
};

// Events API
export const eventsAPI = {
  getAll: () => axios.get(`${API_URL}/events`, authHeader()),
  getById: (id) => axios.get(`${API_URL}/events/${id}`, authHeader()),
  getByCreator: (userId) => axios.get(`${API_URL}/events/creator/${userId}`, authHeader()),
  create: (data) => axios.post(`${API_URL}/events`, data, authHeader()),
  update: (id, data) => axios.put(`${API_URL}/events/${id}`, data, authHeader()),
  delete: (id) => axios.delete(`${API_URL}/events/${id}`, authHeader())
};

// Participants API
export const participantsAPI = {
  rsvp: (eventId) => axios.post(`${API_URL}/participants`, { eventId }, authHeader()),
  getByEvent: (eventId) => axios.get(`${API_URL}/participants/event/${eventId}`, authHeader()),
  getByUser: (userId) => axios.get(`${API_URL}/participants/user/${userId}`, authHeader()),
  getMyRSVPs: () => axios.get(`${API_URL}/participants/my-rsvps`, authHeader()),
  cancel: (id) => axios.delete(`${API_URL}/participants/${id}`, authHeader()),
  cancelByEventAndUser: (eventId, userId) => 
    axios.delete(`${API_URL}/participants/event/${eventId}/user/${userId}`, authHeader())
};
