import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          setToken(storedToken);
        } catch (err) {
          console.warn('Failed to verify token:', err.message);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        // No token = not authenticated. Must sign in.
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Only Admin has admin panel access
  const isAdmin = user && user.role === 'admin';
  // Both instructors and admin can add/edit to calendar
  const canEdit = user && (user.role === 'admin' || user.role === 'instructor');
  // Senior is read-only
  const isSenior = user && user.role === 'senior';
  // Whether user is authenticated at all
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      canEdit,
      isAdmin,
      isSenior,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
