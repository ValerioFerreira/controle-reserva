/**
 * Repositório de Logs
 * Camada de acesso a dados para a entity Log.
 */
import { api } from "@/lib/api";

export async function createLog({ usuario, acao, entidade, entidade_id, militar_matricula, dadosAnteriores, dadosNovos }) {
  const response = await api.post('/logs', {
    usuario: usuario || "sistema",
    acao,
    entidade,
    entidade_id: entidade_id || "",
    militar_matricula: militar_matricula || "",
    payload: JSON.stringify({ anterior: dadosAnteriores || null, novo: dadosNovos || null }),
  });
  return response.data;
}