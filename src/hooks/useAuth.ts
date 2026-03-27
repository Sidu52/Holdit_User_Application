import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setTokens, clearAuth } from '../features/auth/authSlice';
import { tokenService } from '../utils/tokenManager';

export const useAuth = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.user.profile);
  const [loading, setLoading] = useState(true);

  // Initial check configures Redux state if tokens already exist in secure store
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await tokenService.getAccessToken();
        const refreshToken = await tokenService.getRefreshToken();
        
        if (accessToken && refreshToken) {
          dispatch(setTokens({ access: accessToken, refresh: refreshToken }));
        } else {
          dispatch(clearAuth());
        }
      } catch (error) {
        console.error('Failed to restore auth tokens', error);
        dispatch(clearAuth());
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  return { isAuthenticated, user, loading };
};
