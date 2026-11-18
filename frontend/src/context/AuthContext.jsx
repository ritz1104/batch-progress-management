import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  admin: {
    _id: 'usr-admin-1',
    name: 'Super Admin',
    email: 'admin@academy.dev',
    role: 'admin',
    title: 'Academy Director & Operations Lead',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=SuperAdmin'
  },
  instructor: {
    _id: 'usr-trainer-1',
    name: 'Sarah Jenkins',
    email: 'sarah.trainer@academy.dev',
    role: 'instructor',
    title: 'Lead Full-Stack Trainer (Instructor 1)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah'
  },
  instructor2: {
    _id: 'usr-trainer-2',
    name: 'Alex Morgan',
    email: 'alex.trainer@academy.dev',
    role: 'instructor',
    title: 'Associate Trainer (Instructor 2)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex'
  },
  senior: {
    _id: 'usr-senior-3',
    name: 'Dr. Vikram Roy',
    email: 'senior@academy.dev',
    role: 'senior',
    title: 'VP of Academics & Senior Leadership',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Vikram'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      const storedDemoRole = localStorage.getItem('demoRole');

      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Failed to verify token:', err.message);
          localStorage.removeItem('token');
          selectDemoRole(storedDemoRole || 'admin');
        }
      } else {
        // Default to Admin initially so user has full control immediately
        selectDemoRole(storedDemoRole || 'admin');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const selectDemoRole = (roleKey) => {
    const account = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.admin;
    localStorage.removeItem('token');
    localStorage.setItem('demoRole', account.role);
    localStorage.setItem('demoEmail', account.email);
    setToken(null);
    setUser(account);
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.token);
    localStorage.removeItem('demoRole');
    localStorage.removeItem('demoEmail');
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    localStorage.setItem('token', res.token);
    localStorage.removeItem('demoRole');
    localStorage.removeItem('demoEmail');
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('demoRole');
    localStorage.removeItem('demoEmail');
    setToken(null);
    selectDemoRole('senior');
  };

  // Only Admin has admin panel access
  const isAdmin = user && user.role === 'admin';
  // Both instructors and admin can add/edit to calendar
  const canEdit = user && (user.role === 'admin' || user.role === 'instructor');
  // Senior is read-only
  const isSenior = user && user.role === 'senior';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      selectDemoRole,
      canEdit,
      isAdmin,
      isSenior
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
