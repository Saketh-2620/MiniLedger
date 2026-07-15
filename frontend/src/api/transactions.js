import axiosClient from './axiosClient';

/**
 * @param {Object} params - { type, category_id, date_from, date_to, page, limit }
 */
export const getTransactions = (params = {}) =>
  axiosClient.get('/transactions', { params }).then((r) => r.data);

export const getTransaction = (id) =>
  axiosClient.get(`/transactions/${id}`).then((r) => r.data);

/**
 * @param {Object} data - { type, amount, description, date, category_id }
 */
export const createTransaction = (data) =>
  axiosClient.post('/transactions', data).then((r) => r.data);

/**
 * @param {string} id
 * @param {Object} data - partial fields to update
 */
export const updateTransaction = (id, data) =>
  axiosClient.put(`/transactions/${id}`, data).then((r) => r.data);

export const deleteTransaction = (id) =>
  axiosClient.delete(`/transactions/${id}`).then((r) => r.data);
