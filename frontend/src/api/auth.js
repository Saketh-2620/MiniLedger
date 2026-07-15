import axiosClient from './axiosClient';

export const getMe = () =>
  axiosClient.get('/auth/me').then((r) => r.data.user);

export const logout = () =>
  axiosClient.post('/auth/logout');

export const logoutAll = () =>
  axiosClient.post('/auth/logout-all');

// Redirect browser to Google OAuth — must point directly to backend, not Vercel
export const loginWithGoogle = () => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  window.location.href = `${backendUrl}/auth/google`;
};
