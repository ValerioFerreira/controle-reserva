/**
 * Repositório de Logs
 * Camada de acesso a dados para a entity Log.
 */
import { base44 } from "@/api/base44Client";

const entity = base44.entities.Log;

export async function createLog({ usuario, acao, entidade, entidade_id, militar_matricula, dadosAnteriores, dadosNovos }) {
  return entity.create({
    usuario: usuario || "sistema",
    acao,
    entidade,
    entidade_id: entidade_id || "",
    militar_matricula: militar_matricula || "",
    payload: JSON.stringify({ anterior: dadosAnteriores || null, novo: dadosNovos || null }),
  });
}