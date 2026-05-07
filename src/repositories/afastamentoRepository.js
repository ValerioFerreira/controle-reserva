/**
 * Repositório de Afastamentos
 * Camada de acesso a dados para a entity Afastamento.
 */
import { base44 } from "@/api/base44Client";

const entity = base44.entities.Afastamento;

export async function findAfastamentosByMatricula(matricula) {
  return entity.filter({ militar_matricula: matricula }, "-created_date");
}

export async function createAfastamento(data) {
  return entity.create({ ...data, updated_at: new Date().toISOString() });
}

export async function updateAfastamento(id, data) {
  return entity.update(id, { ...data, updated_at: new Date().toISOString() });
}

export async function deleteAfastamento(id) {
  return entity.delete(id);
}