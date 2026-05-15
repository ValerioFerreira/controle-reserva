import { useState } from 'react';
import { api } from '@/lib/api';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="mb-4 border border-slate-200 rounded bg-white shadow-sm overflow-hidden">
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function JsonViewer({ data }) {
  return (
    <pre className="bg-slate-50 p-2 rounded text-xs overflow-auto text-slate-800 border border-slate-100 max-h-64">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ResultadoColuna({ dados, label, cor }) {
  if (!dados) return null;

  const corHeader = cor === 'azul'
    ? 'bg-blue-700 text-white'
    : 'bg-amber-600 text-white';

  const corDatas = cor === 'azul'
    ? 'bg-blue-50 border-blue-200'
    : 'bg-amber-50 border-amber-200';

  const corLogs = cor === 'azul'
    ? 'bg-blue-50 border-blue-200'
    : 'bg-amber-50 border-amber-200';

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

  return (
    <div className="rounded border border-slate-300 overflow-hidden">
      <div className={`px-4 py-3 font-black text-lg ${corHeader}`}>{label}</div>
      <div className="p-3">

        {/* Datas principais */}
        <div className={`rounded border p-3 mb-4 ${corDatas}`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Requerimento</div>
              <div className="text-lg font-black text-slate-900">
                {res?.requerimento ? new Date(res.requerimento).toISOString().split('T')[0] : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Compulsória</div>
              <div className="text-lg font-black text-slate-900">
                {res?.compulsoria ? new Date(res.compulsoria).toISOString().split('T')[0] : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Logs matemáticos */}
        {aud?.precisaoTemporal?.length > 0 && (
          <Section title="Precisão Temporal (Logs Matemáticos)">
            <ul className={`list-disc pl-4 space-y-1 text-xs rounded p-2 border ${corLogs}`}>
              {aud.precisaoTemporal.map((msg, i) => (
                <li key={i} className="text-slate-700">{msg}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Dados Base */}
        {aud?.dadosBase && (
          <Section title="Dados Base & Averbações">
            <JsonViewer data={aud.dadosBase} />
          </Section>
        )}

        {/* Datas Virtuais */}
        {aud?.temposCalculados && (
          <Section title="Datas Virtuais de Ingresso">
            <JsonViewer data={aud.temposCalculados} />
          </Section>
        )}

        {/* Regra 17% */}
        {aud?.regra17 && (
          <Section title="Regra 17% (Transição)">
            <JsonViewer data={aud.regra17} />
          </Section>
        )}

        {/* Regra da Tabela */}
        {aud?.regraTabela && (
          <Section title="Regra da Tabela (Transição)">
            <JsonViewer data={aud.regraTabela} />
          </Section>
        )}

        {/* Escolha da Requerida */}
        {aud?.escolhaRequerida && (
          <Section title="Escolha da Requerida">
            <JsonViewer data={aud.escolhaRequerida} />
          </Section>
        )}

        {/* Compulsória */}
        {aud?.compulsoria && (
          <Section title="Compulsória">
            <JsonViewer data={aud.compulsoria} />
          </Section>
        )}

        {/* PCNH */}
        {aud?.pcnh && (
          <Section title="PCNH Aplicado">
            <JsonViewer data={aud.pcnh} />
          </Section>
        )}
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
      setMsgRecalc({
        tipo: 'ok',
        texto: `[${modo.toUpperCase()}] Concluído: ${data.processados}/${data.total} militares em ${data.durationMs}ms.`,
      });
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
        <button
          onClick={() => recalcular('novo')}
          disabled={loadingNovo || loadingLegado}
          className="bg-blue-700 text-white px-5 py-2 rounded font-bold text-sm hover:bg-blue-800 disabled:opacity-50 transition"
        >
          {loadingNovo ? 'Calculando...' : '⚡ Atualizar com Regras Novas'}
        </button>
        <button
          onClick={() => recalcular('legado')}
          disabled={loadingNovo || loadingLegado}
          className="bg-amber-600 text-white px-5 py-2 rounded font-bold text-sm hover:bg-amber-700 disabled:opacity-50 transition"
        >
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

      {/* Botões de recálculo global */}
      <BotoesRecalculo />

      {/* Busca por matrícula */}
      <form onSubmit={handleBuscar} className="flex gap-3 mb-8 items-center">
        <input
          type="text"
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          placeholder="Matrícula"
          className="border border-slate-300 p-2 rounded px-4 w-48 uppercase font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-800 text-white px-6 py-2 rounded font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition"
        >
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
          {/* Cabeçalho de comparação */}
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
