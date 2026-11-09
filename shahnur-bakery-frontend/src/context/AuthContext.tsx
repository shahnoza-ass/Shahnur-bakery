import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, RegisterData } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('shahnur_token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch {
          localStorage.removeItem('shahnur_token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
  try {
    const { user, token } = await authService.login(email, password);
    localStorage.setItem('shahnur_token', token);
    setUser(user);
    toast.success(`Xush kelibsiz, ${user.firstName}!`);
    return user;  // ← BU QATORNI QO'SHING
  } catch (error: any) {
    throw error;
  }
};

  const register = async (data: RegisterData) => {
    await authService.register(data);
    toast.success('Ro‘yxatdan o‘tdingiz! Endi tizimga kiring.');
  };

  const logout = () => {
    localStorage.removeItem('shahnur_token');
    setUser(null);
    toast.success('Tizimdan chiqdingiz');
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    toast.success('Profil yangilandi');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};