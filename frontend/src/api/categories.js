import axiosClient from './axiosClient';

export const getCategories = () =>
  axiosClient.get('/categories').then((r) => r.data);


export const createCategory = (data) =>
  axiosClient.post('/categories', data).then((r) => r.data);

export const updateCategory = (id, data) =>
  axiosClient.put(`/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id) =>
  axiosClient.delete(`/categories/${id}`).then((r) => r.data);
