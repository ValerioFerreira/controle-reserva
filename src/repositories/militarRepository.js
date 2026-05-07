/**
 * Repositório de Militares
 * Chama a API REST do backend NestJS.
 */
import api from '@/lib/api';

export async function findAllMilitares(params = {}) {
  const { data } = await api.get('/militares', { params });
  // Retorna { data, total, page, totalPages }
  return data;
}

export async function findMilitarByMatricula(matricula) {
  const { data } = await api.get(`/militares/${matricula}`);
  return data;
}

export async function getDashboard() {
  const { data } = await api.get('/militares/dashboard');
  return data;
}