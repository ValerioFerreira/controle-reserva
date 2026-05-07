/**
 * Serviço de Militares
 * Orquestra operações de negócio usando os repositórios.
 * NÃO acessa a base de dados diretamente — use os repositórios.
 */
import { findAllMilitares, findMilitarByMatricula, updateMilitar } from "../repositories/militarRepository";
import * as averbRepo from "../repositories/averbacaoRepository";
import * as afastRepo from "../repositories/afastamentoRepository";
import { createLog } from "../repositories/logRepository";

// ─── Utilitário de log ──────────────────────────────
async function log({ acao, entidade, entidade_id, matricula, anterior, novo }) {
  try {
    await createLog({ acao, entidade, entidade_id, militar_matricula: matricula, dadosAnteriores: anterior, dadosNovos: novo });
  } catch (_) { /* log nunca deve quebrar o fluxo */ }
}

// ─── Militares ──────────────────────────────
export async function fetchMilitares() {
  return findAllMilitares();
}

export async function fetchMilitarByMatricula(matricula) {
  return findMilitarByMatricula(matricula);
}

// ─── Recálculo de datas ──────────────────────────────
async function recalcularDatas(matricula) {
  const [militar, averbacoes, afastamentos] = await Promise.all([
    findMilitarByMatricula(matricula),
    averbRepo.findAverbacoesByMatricula(matricula),
    afastRepo.findAfastamentosByMatricula(matricula),
  ]);
  if (!militar) return;

  const totalAverb = averbacoes.reduce((s, a) => s + (a.dias || 0), 0);
  const totalAfast = afastamentos.reduce((s, a) => s + (a.dias || 0), 0);

  // Base: data de ingresso + 30 anos para requerimento, + 35 anos para compulsória
  const ingresso = new Date(militar.data_ingresso);

  const baseReq = new Date(ingresso);
  baseReq.setFullYear(baseReq.getFullYear() + 30);

  const baseComp = new Date(ingresso);
  baseComp.setFullYear(baseComp.getFullYear() + 35);

  // Averbações antecipam requerimento; afastamentos adiam compulsória
  const diasAntecipacao = Math.floor(totalAverb / 365) * 30;
  baseReq.setDate(baseReq.getDate() - diasAntecipacao);
  baseComp.setDate(baseComp.getDate() + totalAfast);

  const reserva_requerimento = baseReq.toISOString().split("T")[0];
  const reserva_compulsoria = baseComp.toISOString().split("T")[0];

  await updateMilitar(militar.id, { reserva_requerimento, reserva_compulsoria });
}

// ─── Averbações ──────────────────────────────
export async function fetchAverbacoesByMatricula(matricula) {
  return averbRepo.findAverbacoesByMatricula(matricula);
}

export async function createAverbacao(data) {
  const { militar_matricula } = data;
  const item = await averbRepo.createAverbacao(data);
  await log({ acao: "CREATE", entidade: "Averbacao", entidade_id: item.id, matricula: militar_matricula, novo: item });
  await recalcularDatas(militar_matricula);
  return item;
}

export async function updateAverbacao(id, data) {
  const anterior = data;
  const item = await averbRepo.updateAverbacao(id, data);
  await log({ acao: "UPDATE", entidade: "Averbacao", entidade_id: id, matricula: data.militar_matricula, anterior, novo: item });
  await recalcularDatas(data.militar_matricula);
  return item;
}

export async function deleteAverbacao(id, matricula, dadosAnteriores) {
  await averbRepo.deleteAverbacao(id);
  await log({ acao: "DELETE", entidade: "Averbacao", entidade_id: id, matricula, anterior: dadosAnteriores });
  await recalcularDatas(matricula);
}

// ─── Afastamentos ──────────────────────────────
export async function fetchAfastamentosByMatricula(matricula) {
  return afastRepo.findAfastamentosByMatricula(matricula);
}

export async function createAfastamento(data) {
  const { militar_matricula } = data;
  const item = await afastRepo.createAfastamento(data);
  await log({ acao: "CREATE", entidade: "Afastamento", entidade_id: item.id, matricula: militar_matricula, novo: item });
  await recalcularDatas(militar_matricula);
  return item;
}

export async function updateAfastamento(id, data) {
  const anterior = data;
  const item = await afastRepo.updateAfastamento(id, data);
  await log({ acao: "UPDATE", entidade: "Afastamento", entidade_id: id, matricula: data.militar_matricula, anterior, novo: item });
  await recalcularDatas(data.militar_matricula);
  return item;
}

export async function deleteAfastamento(id, matricula, dadosAnteriores) {
  await afastRepo.deleteAfastamento(id);
  await log({ acao: "DELETE", entidade: "Afastamento", entidade_id: id, matricula, anterior: dadosAnteriores });
  await recalcularDatas(matricula);
}

// ─── Sync (placeholder para futura integração) ──────────────────────────────
let syncStatus = { lastSync: null, status: "never" };

export async function syncGoogleSheets() {
  // Placeholder: futuramente chamará API externa
  syncStatus = { lastSync: new Date().toISOString(), status: "synced" };
  await log({ acao: "SYNC", entidade: "GoogleSheets", entidade_id: "-" });
  return syncStatus;
}

export function getSyncStatus() {
  return { ...syncStatus };
}