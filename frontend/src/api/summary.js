import axiosClient from './axiosClient';

/**
 * @param {Object} params - { date_from?, date_to? }  defaults to current month on server
 */
export const getSummary = (params = {}) =>
  axiosClient.get('/summary', { params }).then((r) => r.data);
