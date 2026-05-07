/**
 * Repositório de Militares
 * Camada de acesso a dados para a entity Militar.
 * Facilita futura migração para API externa.
 */
import { base44 } from "@/api/base44Client";

const entity = base44.entities.Militar;

export async function findAllMilitares() {
  const response = await entity.list("ordem_hierarquica", 200);
  console.log("findAllMilitares response:", response);
  console.log("findAllMilitares response.data:", response?.data);
  return response?.data ? response.data : response;
}

export async function findMilitarByMatricula(matricula) {
  const response = await entity.filter({ matricula });
  console.log("findMilitarByMatricula response:", response);
  console.log("findMilitarByMatricula response.data:", response?.data);
  const results = response?.data ? response.data : response;
  const safeResults = Array.isArray(results) ? results : [];
  return safeResults[0] || null;
}

export async function saveMilitar(data) {
  return entity.create(data);
}

export async function updateMilitar(id, data) {
  return entity.update(id, data);
}