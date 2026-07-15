import axiosClient from './axiosClient';

export const getMe = () =>
  axiosClient.get('/auth/me').then((r) => r.data.user);

export const logout = () =>
  axiosClient.post('/auth/logout');

export const logoutAll = () =>
  axiosClient.post('/auth/logout-all');

// Redirect browser to Google OAuth — no axios needed, it's a full redirect
export const loginWithGoogle = () => {
  window.location.href = '/api/auth/google';
};
