/**
 * Serviço de Militares
 * Orquestra operações usando os repositórios.
 * Recálculo de datas é feito pelo backend após cada operação.
 */
import { findAllMilitares, findMilitarByMatricula, getDashboard } from '../repositories/militarRepository';
import * as averbRepo from '../repositories/averbacaoRepository';
import * as afastRepo from '../repositories/afastamentoRepository';
import api from '@/lib/api';

// ─── Militares ──────────────────────────────
export async function fetchMilitares(params = {}) {
  const result = await findAllMilitares(params);
  // result = { data, total, page, totalPages }
  return result.data || [];
}

export async function fetchMilitaresPage(params = {}) {
  // Retorna o objeto completo com paginação
  return findAllMilitares(params);
}

export async function fetchMilitarByMatricula(matricula) {
  return findMilitarByMatricula(matricula);
}

export async function fetchDashboard() {
  return getDashboard();
}

// ─── Averbações ──────────────────────────────
export async function fetchAverbacoesByMatricula(matricula) {
  return averbRepo.findAverbacoesByMatricula(matricula);
}

export async function createAverbacao(matricula, data) {
  return averbRepo.createAverbacao(matricula, data);
}

export async function updateAverbacao(id, matricula, data) {
  return averbRepo.updateAverbacao(id, matricula, data);
}

export async function deleteAverbacao(id, matricula) {
  return averbRepo.deleteAverbacao(id, matricula);
}

// ─── Afastamentos ──────────────────────────────
export async function fetchAfastamentosByMatricula(matricula) {
  return afastRepo.findAfastamentosByMatricula(matricula);
}

export async function createAfastamento(matricula, data) {
  return afastRepo.createAfastamento(matricula, data);
}

export async function updateAfastamento(id, matricula, data) {
  return afastRepo.updateAfastamento(id, matricula, data);
}

export async function deleteAfastamento(id, matricula) {
  return afastRepo.deleteAfastamento(id, matricula);
}

// ─── Google Sheets Sync ──────────────────────────────
export async function syncGoogleSheets() {
  const { data } = await api.post('/sheets/sync');
  return data; // { inserted, updated, errors }
}