/**
 * Repositório de Militares
 * Camada de acesso a dados para a entity Militar.
 * Facilita futura migração para API externa.
 */
import { base44 } from "@/api/base44Client";

const entity = base44.entities.Militar;

export async function findAllMilitares() {
  return entity.list("ordem_hierarquica", 200);
}

export async function findMilitarByMatricula(matricula) {
  const results = await entity.filter({ matricula });
  return results[0] || null;
}

export async function saveMilitar(data) {
  return entity.create(data);
}

export async function updateMilitar(id, data) {
  return entity.update(id, data);
}