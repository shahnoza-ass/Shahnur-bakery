import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('shahnur_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (!error.response) {
      toast.error('Tarmoq xatosi');
      return Promise.reject(error);
    }

    const hadToken = !!localStorage.getItem('shahnur_token');
    const status = error.response.status;
    const data = error.response.data as any;
    const message = data?.message || 'Xatolik yuz berdi';

    switch (status) {
      case 401:
        localStorage.removeItem('shahnur_token');
        if (hadToken && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        if (!hadToken) toast.error(message);
        break;
      case 403:
        toast.error('Ruxsat berilmagan');
        break;
      case 404:
        toast.error('Ma\'lumot topilmadi');
        break;
      case 422:
        if (data?.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => toast.error(err.message));
        } else {
          toast.error(message);
        }
        break;
      case 500:
        toast.error('Serverda xatolik');
        break;
      default:
        toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
