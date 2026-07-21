import axiosClient from './axiosClient';


export const getSummary = (params = {}) =>
  axiosClient.get('/summary', { params }).then((r) => r.data);
