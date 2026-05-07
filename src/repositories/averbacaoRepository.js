/**
 * Repositório de Averbações
 * Camada de acesso a dados para a entity Averbacao.
 */
import { api } from "@/lib/api";

export async function findAverbacoesByMatricula(matricula) {
  const response = await api.get(`/averbacoes?militar_matricula=${matricula}`);
  return response?.data?.data ? response.data.data : (response?.data || []);
}

export async function createAverbacao(data) {
  const response = await api.post('/averbacoes', data);
  return response.data;
}

export async function updateAverbacao(id, data) {
  const response = await api.patch(`/averbacoes/${id}`, data);
  return response.data;
}

export async function deleteAverbacao(id) {
  const response = await api.delete(`/averbacoes/${id}`);
  return response.data;
}