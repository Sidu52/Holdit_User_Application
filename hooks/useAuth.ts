import { useEffect, useState } from "react";
import { tokenService } from "@/services/token";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    const token = await tokenService.getAccessToken();
    console.log("token", token);
    setIsAuthenticated(!!token);
    setLoading(false);
  };

  const login = async (access: string, refresh: string) => {
    await tokenService.setTokens(access, refresh);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await tokenService.clear();
    setIsAuthenticated(false);
  };

  return {
    loading,
    isAuthenticated,
    login,
    logout,
  };
}
