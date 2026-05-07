/**
 * Repositório de Averbações
 * Camada de acesso a dados para a entity Averbacao.
 */
import { base44 } from "@/api/base44Client";

const entity = base44.entities.Averbacao;

export async function findAverbacoesByMatricula(matricula) {
  return entity.filter({ militar_matricula: matricula }, "-created_date");
}

export async function createAverbacao(data) {
  return entity.create({ ...data, updated_at: new Date().toISOString() });
}

export async function updateAverbacao(id, data) {
  return entity.update(id, { ...data, updated_at: new Date().toISOString() });
}

export async function deleteAverbacao(id) {
  return entity.delete(id);
}