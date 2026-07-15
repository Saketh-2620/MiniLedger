import axiosClient from './axiosClient';

export const getNotifications = (params = {}) =>
  axiosClient.get('/notifications', { params }).then((r) => r.data);
