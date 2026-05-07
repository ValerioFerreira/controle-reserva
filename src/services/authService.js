/**
 * AuthService
 * Autenticação via JWT com o backend NestJS.
 */
import api from '@/lib/api';

const AUTH_KEY = 'cbmpe_session';

export async function login(username, password) {
  try {
    const { data } = await api.post('/auth/login', { username, password });
    // data = { access_token, user: { nome, perfil } }
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    return data.user;
  } catch (err) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    return session?.user || null;
  } catch (_) {
    return null;
  }
}

export function isAuthenticated() {
  return !!getSession();
}