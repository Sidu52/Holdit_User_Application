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
      console.log("[AUTH] Initializing Auth State...");
      try {
        const accessToken = await tokenService.getAccessToken();
        const refreshToken = await tokenService.getRefreshToken();
        
        console.log("[AUTH] SecureStore Result:", accessToken ? "Access FOUND" : "Access MISSING");

        if (accessToken && refreshToken && 
            accessToken !== "null" && accessToken !== "undefined" && 
            refreshToken !== "null" && refreshToken !== "undefined") {
          console.log("[AUTH] Valid tokens found, dispatching to Redux.");
          dispatch(setTokens({ access: accessToken, refresh: refreshToken }));
        } else {
          console.log("[AUTH] No valid tokens found in SecureStore.");
          dispatch(clearAuth());
        }
      } catch (error) {
        console.error('[AUTH] Failed to restore tokens:', error);
        dispatch(clearAuth());
      } finally {
        setLoading(false);
        console.log("[AUTH] Initialization complete.");
      }
    };


    initializeAuth();
  }, [dispatch]);

  return { isAuthenticated, user, loading };
};
