import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: injeta o token JWT em toda requisição
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('cbmpe_session');
    if (session) {
      try {
        const { access_token } = JSON.parse(session);
        if (access_token) {
          config.headers.Authorization = `Bearer ${access_token}`;
        }
      } catch (_) {
        // Sessão inválida — ignorar
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de response: redireciona para login se token expirado/inválido
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cbmpe_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
