/**
 * Repositório de Militares
 * Camada de acesso a dados para a entity Militar.
 * Facilita futura migração para API externa.
 */
import { api } from "@/lib/api";

export async function findAllMilitares() {
  const response = await api.get('/militares');
  console.log("findAllMilitares response:", response);
  console.log("findAllMilitares response.data:", response?.data);
  return response?.data?.data ? response.data.data : (response?.data || []);
}

export async function findMilitarByMatricula(matricula) {
  const response = await api.get(`/militares?matricula=${matricula}`);
  console.log("findMilitarByMatricula response:", response);
  console.log("findMilitarByMatricula response.data:", response?.data);
  const results = response?.data?.data ? response.data.data : (response?.data || []);
  const safeResults = Array.isArray(results) ? results : [];
  return safeResults[0] || null;
}

export async function saveMilitar(data) {
  const response = await api.post('/militares', data);
  return response.data;
}

export async function updateMilitar(id, data) {
  const response = await api.patch(`/militares/${id}`, data);
  return response.data;
}