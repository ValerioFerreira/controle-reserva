import { useState } from 'react';
import { api } from '@/lib/api';

// ─── Utilitário de data ───────────────────────────────────────────────────────

function formatarDataBR(valor) {
  if (!valor) return '—';
  try {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return String(valor);
    // Usar UTC para evitar deslocamento de fuso ao formatar datas ISO (yyyy-MM-dd)
    const iso = typeof valor === 'string' && valor.length === 10;
    const ref = iso ? new Date(valor + 'T12:00:00Z') : d;
    const dia = String(ref.getUTCDate()).padStart(2, '0');
    const mes = String(ref.getUTCMonth() + 1).padStart(2, '0');
    const ano = ref.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return String(valor);
  }
}

// Percorre recursivamente um objeto e formata valores que parecem datas ISO
function formatarObjetoDatas(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(formatarObjetoDatas);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      result[k] = formatarDataBR(v);
    } else if (typeof v === 'object' && v !== null) {
      result[k] = formatarObjetoDatas(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({ title, children, accent }) {
  return (
    <div className="mb-4 border border-slate-200 rounded bg-white shadow-sm overflow-hidden">
      <div className={`px-3 py-2 border-b border-slate-200 ${accent || 'bg-slate-100'}`}>
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function JsonViewer({ data }) {
  const formatado = formatarObjetoDatas(data);
  return (
    <pre className="bg-slate-50 p-2 rounded text-xs overflow-auto text-slate-800 border border-slate-100 max-h-64 whitespace-pre-wrap">
      {JSON.stringify(formatado, null, 2)}
    </pre>
  );
}

function Campo({ label, valor, destaque }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-xs font-bold text-right ${destaque ? 'text-blue-700' : 'text-slate-800'}`}>{valor}</span>
    </div>
  );
}

function LogsMat({ logs, corFundo }) {
  if (!logs?.length) return <p className="text-xs text-slate-400 italic">Sem logs registrados.</p>;
  return (
    <ol className={`list-decimal pl-5 space-y-1.5 text-xs p-3 rounded border ${corFundo}`}>
      {logs.map((msg, i) => (
        <li key={i} className="text-slate-700 leading-relaxed">{msg}</li>
      ))}
    </ol>
  );
}

// ─── Seção de Dados do Militar (global, acima das colunas) ────────────────────

function DadosMilitar({ dados }) {
  if (!dados) return null;
  return (
    <div className="mb-6 bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-2 font-bold text-sm uppercase tracking-wide">
        Dados do Militar
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Identificação</div>
          <Campo label="Matrícula" valor={dados.matricula} />
          <Campo label="Nome" valor={dados.nome || '—'} />
          <Campo label="Sexo" valor={dados.sexo} />
          <Campo label="Posto/Grad" valor={dados.postoGrad} />
          <Campo label="PCNH" valor={dados.pcnh ? 'SIM' : 'NÃO'} destaque={dados.pcnh} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Datas</div>
          <Campo label="Nascimento" valor={formatarDataBR(dados.dataNascimento)} />
          <Campo label="Ingresso" valor={formatarDataBR(dados.dataIngresso)} />
          <Campo label="Última Promoção" valor={formatarDataBR(dados.dataUltimaPromocao)} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">
            Averbações — Total: <span className="text-slate-800">{dados.averbacoes?.totalDias ?? 0} dias</span>
          </div>
          {Object.entries(dados.averbacoes?.porTipo || {}).map(([tipo, dias]) => (
            <Campo key={tipo} label={tipo} valor={`${dias} dias`} />
          ))}
          {!Object.keys(dados.averbacoes?.porTipo || {}).length && (
            <p className="text-xs text-slate-400 italic">Sem averbações registradas.</p>
          )}
          <div className="mt-3 text-xs font-bold text-slate-500 uppercase mb-2">
            Afastamentos — Total: <span className="text-slate-800">{dados.afastamentos?.totalDias ?? 0} dias</span>
          </div>
          {Object.entries(dados.afastamentos?.porTipo || {}).map(([tipo, dias]) => (
            <Campo key={tipo} label={tipo} valor={`${dias} dias`} />
          ))}
          {!Object.keys(dados.afastamentos?.porTipo || {}).length && (
            <p className="text-xs text-slate-400 italic">Sem afastamentos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Coluna de resultado ──────────────────────────────────────────────────────

function ResultadoColuna({ dados, label, cor }) {
  if (!dados) return null;

  const isAzul = cor === 'azul';
  const corHeader = isAzul ? 'bg-blue-700 text-white' : 'bg-amber-600 text-white';
  const corDatas  = isAzul ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200';
  const corLogs   = isAzul ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200';
  const corSecAcc = isAzul ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800';

  if (!dados.ok) {
    return (
      <div className="rounded border border-red-300 overflow-hidden">
        <div className={`px-4 py-2 font-bold ${corHeader}`}>{label}</div>
        <div className="p-4 text-red-600 bg-red-50 text-sm">{dados.aviso || 'Erro no cálculo.'}</div>
      </div>
    );
  }

  const aud = dados.auditoria;
  const res = dados.resultados;

  const fmtD = (v) => formatarDataBR(v);
  const fmtS = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? formatarDataBR(v) : v;

  // ── 1. Resultado Final ──
  const blocoResultado = (
    <div className={`rounded border p-3 mb-4 ${corDatas}`}>
      <div className="text-xs font-bold uppercase text-slate-500 mb-2">Resultado Final</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Requerimento</div>
          <div className="text-lg font-black text-slate-900">{fmtD(res?.requerimento)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Compulsória</div>
          <div className="text-lg font-black text-slate-900">{fmtD(res?.compulsoria)}</div>
        </div>
      </div>
    </div>
  );

  // ── 2. Regra 17% ──
  const r17 = aud?.regra17;
  const blocoRegra17 = r17 ? (
    <Section title="Regra dos 17% (Art. 89-A, I)" accent={corSecAcc}>
      <div className="space-y-1">
        {r17.data30AnosReal && <Campo label="Data de 30 anos (ciclo civil real)" valor={fmtS(r17.data30AnosReal)} />}
        {r17.diasTotais30Anos != null && <Campo label="Dias reais no ciclo de 30 anos" valor={`${r17.diasTotais30Anos} dias`} />}
        {r17.diasAverbados != null && <Campo label="Dias averbados abatidos" valor={`${r17.diasAverbados} dias`} />}
        {r17.diasNecessariosComAverbacao != null && <Campo label="Dias restantes após averbações" valor={`${r17.diasNecessariosComAverbacao} dias`} />}
        {r17.dataAlvoSemPedagio && <Campo label="Nova data-alvo (com averbações)" valor={fmtS(r17.dataAlvoSemPedagio)} />}
        {r17.diasFaltantesRef != null && <Campo label="Dias faltando em 31/12/2021" valor={`${r17.diasFaltantesRef} dias`} />}
        {r17.diasPedagio != null && (
          <Campo
            label="Pedágio (17% × dias faltantes → Math.round)"
            valor={r17.diasFaltantesRef > 0 ? `${r17.diasFaltantesRef} × 0,17 = ${(r17.diasFaltantesRef * 0.17).toFixed(2)} → ${r17.diasPedagio} dias` : '0 dias (requisito já cumprido)'}
          />
        )}
        {r17.dataFinal && <Campo label="Data final do Pedágio 17%" valor={fmtS(r17.dataFinal)} destaque />}
        {r17.modelo && <Campo label="Modelo" valor={r17.modelo} />}
      </div>
    </Section>
  ) : <Section title="Regra dos 17% (Art. 89-A, I)" accent={corSecAcc}><p className="text-xs text-slate-400 italic">Não aplicável (Pós-Reforma ou Feminino).</p></Section>;

  // ── 3. Regra da Tabela ──
  const rt = aud?.regraTabela;
  const blocoTabela = rt ? (
    <Section title="Regra da Tabela — 4 meses por ano (Anexo Único)" accent={corSecAcc}>
      {rt.aplicavel === false ? (
        <p className="text-xs text-slate-600 italic">{rt.motivo || 'Inaplicável.'}</p>
      ) : (
        <div className="space-y-1">
          {rt.data25Efetivo && <Campo label="Data dos 25 anos efetivos" valor={fmtS(rt.data25Efetivo)} />}
          {rt.anosFaltantes != null && (
            <Campo
              label="Anos faltantes (diferença para 2022)"
              valor={rt.anosFaltantes <= 0 ? `${rt.anosFaltantes} anos (já em 2022 ou antes)` : `${rt.anosFaltantes} anos`}
            />
          )}
          {rt.anosCompletos != null && <Campo label="Anos completos em 31/12/2021" valor={`${rt.anosCompletos} anos`} />}
          {rt.mesesPedagio != null && (
            <Campo
              label="Pedágio (anos × 4 meses, máx 60)"
              valor={`${Math.max(rt.anosFaltantes ?? 0, 0)} × 4 = ${rt.mesesPedagio} meses`}
            />
          )}
          {rt.dataBase && <Campo label="Data-base (início do pedágio)" valor={fmtS(rt.dataBase)} />}
          {rt.dataFinal && <Campo label="Data final do pedágio" valor={fmtS(rt.dataFinal)} destaque />}
          {rt.data30AnosTotal && <Campo label="Data dos 30 anos totais" valor={fmtS(rt.data30AnosTotal)} />}
          {rt.modelo && <Campo label="Modelo" valor={rt.modelo} />}
        </div>
      )}
    </Section>
  ) : <Section title="Regra da Tabela — 4 meses por ano (Anexo Único)" accent={corSecAcc}><p className="text-xs text-slate-400 italic">Não aplicável (Pós-Reforma ou Feminino).</p></Section>;

  // ── 4. Escolha da Requerida ──
  const er = aud?.escolhaRequerida;
  const blocoRequerida = er ? (
    <Section title="Escolha da Requerida" accent={corSecAcc}>
      <div className="space-y-1">
        <Campo label="Regra" valor={er.regra} />
        {er.datasComparadas && er.datasComparadas.map((d, i) => (
          <Campo key={i} label={`Data comparada ${i + 1}`} valor={fmtS(d)} />
        ))}
        {er.data35Total && <Campo label="Data dos 35 anos (Total)" valor={fmtS(er.data35Total)} />}
        {er.data30Efetivo && <Campo label="Data dos 30 anos (Efetivo)" valor={fmtS(er.data30Efetivo)} />}
        {er.prevaleceu && <Campo label="Data prevalecida" valor={fmtS(er.prevaleceu)} destaque />}
        {er.motivo && <Campo label="Motivo" valor={er.motivo} />}
        {er.datasComparadas?.length === 2 && (
          <Campo
            label="Diferença entre as datas"
            valor={(() => {
              try {
                const d1 = new Date(er.datasComparadas[0] + 'T12:00:00Z');
                const d2 = new Date(er.datasComparadas[1] + 'T12:00:00Z');
                const diff = Math.abs(Math.round((d2 - d1) / 86400000));
                return `${diff} dias`;
              } catch { return '—'; }
            })()}
          />
        )}
      </div>
    </Section>
  ) : null;

  // ── 5. Compulsória ──
  const comp = aud?.compulsoria;
  const bPCNH = aud?.pcnh;
  const blocoCompulsoria = (comp || bPCNH) ? (
    <Section title="Compulsória (Art. 90)" accent={corSecAcc}>
      <div className="space-y-1">
        {comp?.regraAplicada && <Campo label="Regra aplicada" valor={comp.regraAplicada} />}
        {comp?.limiteIdade && <Campo label="Limite por idade" valor={fmtS(comp.limiteIdade)} />}
        {comp?.limitePosto && <Campo label="Limite pelo posto" valor={fmtS(comp.limitePosto)} />}
        {comp?.requeridaBase && <Campo label="Requerida (base de comparação)" valor={fmtS(comp.requeridaBase)} />}
        {comp?.datasIntermediarias?.brutaMinPostoIdade && (
          <Campo label="Bruta [min(posto, idade)]" valor={fmtS(comp.datasIntermediarias.brutaMinPostoIdade)} />
        )}
        {comp?.datasIntermediarias?.maxBrutaRequerida && (
          <Campo label="Pós-ajuste [max(bruta, requerida)]" valor={fmtS(comp.datasIntermediarias.maxBrutaRequerida)} />
        )}
        {comp?.resultadoFinal && <Campo label="Resultado final da compulsória" valor={fmtS(comp.resultadoFinal)} destaque />}
        {bPCNH?.aplicado && (
          <>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">PCNH Aplicado</div>
            </div>
            <Campo label="Compulsória anterior" valor={fmtS(bPCNH.compulsoriaAnterior)} />
            <Campo label="Última promoção" valor={fmtS(bPCNH.promocao)} />
            <Campo label="Nova compulsória (promoção + 2 meses)" valor={fmtS(bPCNH.novaCompulsoria)} destaque />
            <Campo label="Fórmula" valor={bPCNH.regra} />
          </>
        )}
      </div>
    </Section>
  ) : null;

  // ── 6. Logs Matemáticos ──
  const blocoLogs = (
    <Section title="Logs Matemáticos Detalhados" accent={corSecAcc}>
      <LogsMat logs={aud?.precisaoTemporal} corFundo={corLogs} />
    </Section>
  );

  return (
    <div className="rounded border border-slate-300 overflow-hidden">
      <div className={`px-4 py-3 font-black text-base ${corHeader}`}>{label}</div>
      <div className="p-3">
        {blocoResultado}
        {blocoRegra17}
        {blocoTabela}
        {blocoRequerida}
        {blocoCompulsoria}
        {blocoLogs}
      </div>
    </div>
  );
}

// ─── Botões de recálculo ──────────────────────────────────────────────────────

function BotoesRecalculo() {
  const [loadingNovo, setLoadingNovo] = useState(false);
  const [loadingLegado, setLoadingLegado] = useState(false);
  const [msgRecalc, setMsgRecalc] = useState(null);

  const recalcular = async (modo) => {
    const endpoint = modo === 'novo' ? '/militares/recalcular-reservas' : '/militares/recalcular-reservas-legado';
    const setLoading = modo === 'novo' ? setLoadingNovo : setLoadingLegado;
    setLoading(true);
    setMsgRecalc(null);
    try {
      const { data } = await api.post(endpoint);
      setMsgRecalc({ tipo: 'ok', texto: `[${modo.toUpperCase()}] Concluído: ${data.processados}/${data.total} militares em ${data.durationMs}ms.` });
    } catch (err) {
      setMsgRecalc({ tipo: 'erro', texto: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 p-4 bg-white border border-slate-200 rounded shadow-sm">
      <div className="text-xs font-bold text-slate-500 uppercase mb-3">Recalcular todos os militares</div>
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => recalcular('novo')} disabled={loadingNovo || loadingLegado}
          className="bg-blue-700 text-white px-5 py-2 rounded font-bold text-sm hover:bg-blue-800 disabled:opacity-50 transition">
          {loadingNovo ? 'Calculando...' : '⚡ Atualizar com Regras Novas'}
        </button>
        <button onClick={() => recalcular('legado')} disabled={loadingNovo || loadingLegado}
          className="bg-amber-600 text-white px-5 py-2 rounded font-bold text-sm hover:bg-amber-700 disabled:opacity-50 transition">
          {loadingLegado ? 'Calculando...' : '📋 Atualizar com Regras Antigas'}
        </button>
      </div>
      {msgRecalc && (
        <div className={`mt-3 text-sm px-3 py-2 rounded border font-mono ${msgRecalc.tipo === 'ok' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {msgRecalc.texto}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TestePage() {
  const [matricula, setMatricula] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!matricula.trim()) return;
    setLoading(true);
    setResultado(null);
    setErro(null);
    try {
      const { data } = await api.get(`/militares/auditoria-dupla/${matricula.trim()}`);
      if (!data.ok) {
        setErro(data.aviso || 'Erro desconhecido ao calcular.');
      } else {
        setResultado(data);
      }
    } catch (err) {
      setErro(err.response?.data?.message || err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto bg-slate-50 min-h-screen font-mono">
      <h1 className="text-2xl font-black mb-1 uppercase text-slate-800">Painel de Auditoria de Cálculos</h1>
      <p className="text-slate-500 text-sm mb-6">Acesso técnico — compare regras novas e antigas lado a lado</p>

      <BotoesRecalculo />

      <form onSubmit={handleBuscar} className="flex gap-3 mb-6 items-center">
        <input type="text" value={matricula} onChange={e => setMatricula(e.target.value)}
          placeholder="Matrícula" className="border border-slate-300 p-2 rounded px-4 w-48 uppercase font-mono text-sm" />
        <button type="submit" disabled={loading}
          className="bg-slate-800 text-white px-6 py-2 rounded font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition">
          {loading ? 'Calculando...' : 'Auditar'}
        </button>
      </form>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
          <strong>Erro:</strong> {erro}
        </div>
      )}

      {resultado && (
        <>
          {/* Dados do Militar — acima das colunas */}
          <DadosMilitar dados={resultado.dadosMilitar} />

          {/* Cabeçalhos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-700 text-white rounded px-4 py-2 text-center text-sm font-bold">
              REGRAS NOVAS — Calendário Real / date-fns
            </div>
            <div className="bg-amber-600 text-white rounded px-4 py-2 text-center text-sm font-bold">
              REGRAS ANTIGAS — Ano Administrativo 365 dias
            </div>
          </div>

          {/* Colunas lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultadoColuna dados={resultado.novo} label="Regras Novas" cor="azul" />
            <ResultadoColuna dados={resultado.legado} label="Regras Antigas" cor="amarelo" />
          </div>
        </>
      )}
    </div>
  );
}
