import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { userEndpoints } from '../../api/endpoints/user';
import { setProfile, setAddresses } from './userSlice';
import { RootState } from '../../store';

export const QUERY_KEYS = {
  profile: ['user', 'profile'],
  addresses: ['user', 'addresses'],
  address: (id: string) => ['user', 'address', id],
  nearestStores: ['stores', 'nearest'],
  store: (id: string) => ['stores', id],
};

export const useProfile = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const response = await userEndpoints.getProfile();
      const profileData = response.data?.data;
      if (profileData) {
        dispatch(setProfile(profileData));
      }
      return profileData;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: userEndpoints.updateProfile,
    onSuccess: (response) => {
      const profileData = response.data?.data;
      if (profileData) {
        dispatch(setProfile(profileData));
        queryClient.setQueryData(QUERY_KEYS.profile, profileData);
      }
    },
  });
};

export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: userEndpoints.updateLocation,
  });
};

export const useAddresses = () => {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: QUERY_KEYS.addresses,
    queryFn: async () => {
      const response = await userEndpoints.getAddresses();
      const addressesData = response.data?.data || [];
      dispatch(setAddresses(addressesData));
      return addressesData;
    },
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userEndpoints.addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
    },
  });
};

export const useAddress = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.address(id),
    queryFn: async () => {
      const response = await userEndpoints.getAddress(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userEndpoints.updateAddress(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.address(variables.id) });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userEndpoints.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addresses });
    },
  });
};

export const useNearestStores = (params?: { lat: number; lng: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.nearestStores, params],
    queryFn: async () => {
      const response = await userEndpoints.getNearestStores(params);
      return response.data?.data;
    },
    enabled: !!params?.lat && !!params?.lng,
  });
};

export const useStore = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.store(id),
    queryFn: async () => {
      const response = await userEndpoints.getStore(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
};
