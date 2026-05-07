/**
 * Repositório de Averbações
 * Chama a API REST do backend NestJS.
 */
import api from '@/lib/api';

export async function findAverbacoesByMatricula(matricula) {
  const { data } = await api.get(`/militares/${matricula}/averbacoes`);
  return data;
}

export async function createAverbacao(matricula, payload) {
  const { data } = await api.post(`/militares/${matricula}/averbacoes`, payload);
  return data;
}

export async function updateAverbacao(id, matricula, payload) {
  const { data } = await api.put(`/militares/${matricula}/averbacoes/${id}`, payload);
  return data;
}

export async function deleteAverbacao(id, matricula) {
  const { data } = await api.delete(`/militares/${matricula}/averbacoes/${id}`);
  return data;
}