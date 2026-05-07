/**
 * Repositório de Afastamentos
 * Camada de acesso a dados para a entity Afastamento.
 */
import { api } from "@/lib/api";

export async function findAfastamentosByMatricula(matricula) {
  const response = await api.get(`/afastamentos?militar_matricula=${matricula}`);
  return response?.data?.data ? response.data.data : (response?.data || []);
}

export async function createAfastamento(data) {
  const response = await api.post('/afastamentos', data);
  return response.data;
}

export async function updateAfastamento(id, data) {
  const response = await api.patch(`/afastamentos/${id}`, data);
  return response.data;
}

export async function deleteAfastamento(id) {
  const response = await api.delete(`/afastamentos/${id}`);
  return response.data;
}