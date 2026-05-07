/**
 * Repositório de Afastamentos
 * Chama a API REST do backend NestJS.
 */
import api from '@/lib/api';

export async function findAfastamentosByMatricula(matricula) {
  const { data } = await api.get(`/militares/${matricula}/afastamentos`);
  return data;
}

export async function createAfastamento(matricula, payload) {
  const { data } = await api.post(`/militares/${matricula}/afastamentos`, payload);
  return data;
}

export async function updateAfastamento(id, matricula, payload) {
  const { data } = await api.put(`/militares/${matricula}/afastamentos/${id}`, payload);
  return data;
}

export async function deleteAfastamento(id, matricula) {
  const { data } = await api.delete(`/militares/${matricula}/afastamentos/${id}`);
  return data;
}