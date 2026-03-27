import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { authEndpoints } from '../../api/endpoints/auth';
import { setTokens, clearAuth } from './authSlice';
import { setProfile } from '../user/userSlice';
import { tokenService } from '../../utils/tokenManager';

export const useLogin = () => {
  return useMutation({
    mutationFn: authEndpoints.login,
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: authEndpoints.resendOtp,
  });
};

export const useVerifyOtp = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: authEndpoints.verifyOtp,
    onSuccess: async (response) => {
      const { accessToken, refreshToken, user } = response.data?.data || {};
      if (accessToken && refreshToken) {
        await tokenService.setTokens(accessToken, refreshToken);
        dispatch(setTokens({ access: accessToken, refresh: refreshToken }));
      }
      if (user) {
        dispatch(setProfile(user));
      }
    },
  });
};

export const useCompleteProfile = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: authEndpoints.completeProfile,
    onSuccess: (response) => {
      const { user } = response.data?.data || {};
      if (user) {
        dispatch(setProfile(user));
      }
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: authEndpoints.logout,
    onSuccess: async () => {
      await tokenService.clear();
      dispatch(clearAuth());
      dispatch(setProfile(null));
    },
    onError: async () => {
      // Force logout on client even if server request fails
      await tokenService.clear();
      dispatch(clearAuth());
      dispatch(setProfile(null));
    }
  });
};
