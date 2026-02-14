import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('eduai_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eduai_token');
    if (token) {
      authApi
        .getProfile()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('eduai_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('eduai_token');
          localStorage.removeItem('eduai_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('eduai_token', token);
    localStorage.setItem('eduai_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('eduai_token', token);
    localStorage.setItem('eduai_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('eduai_token');
    localStorage.removeItem('eduai_user');
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authApi.getProfile();
    setUser(res.data.user);
    localStorage.setItem('eduai_user', JSON.stringify(res.data.user));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
