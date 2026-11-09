import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string;
  status: string;
  isActive: boolean;
  address?: any;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...user } = res.data.data;
    return { user, token };
  },

  async register(data: RegisterData): Promise<any> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
};
