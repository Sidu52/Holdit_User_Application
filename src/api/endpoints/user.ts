import { api } from '../client';

export const userEndpoints = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  updateLocation: (data: { lat: number; lng: number }) => api.put('/user/location', data),
  getAddresses: () => api.get('/user/addresses'),
  addAddress: (data: any) => api.post('/user/addresses', data),
  getAddress: (id: string) => api.get(`/user/address/${id}`),
  updateAddress: (id: string, data: any) => api.put(`/user/address/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/user/address/${id}`),
  getNearestStores: (params?: { lat: number; lng: number }) => api.get('/user/stores/nearest', { params }),
  getStore: (id: string) => api.get(`/user/stores/${id}`),
};
