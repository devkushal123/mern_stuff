import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken, getAccessToken } from '../api/axios';

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken); 
    setToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.accessToken); 
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setAccessToken(null); setToken(null); setUser(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.accessToken); setToken(data.accessToken);
        const me = await api.get('/users/me');
        setUser(me.data.user);
      } catch {}
    })();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, login, register, logout, token, getAccessToken }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
