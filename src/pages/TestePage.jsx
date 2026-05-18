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

function NarrativaCalculo({ aud, modelo }) {
  if (!aud) return null;

  const r17 = aud?.regra17;
  const rt = aud?.regraTabela;
  const er = aud?.escolhaRequerida;
  const comp = aud?.compulsoria;
  const pcnh = aud?.pcnh;

  const ehNovo = modelo === 'NOVO';

  return (
    <div className="bg-white border border-slate-200 rounded p-5 mt-4">
      <div className="space-y-5 text-sm leading-relaxed text-slate-700 text-justify">

        <div>
          <h4 className="font-black text-slate-800 mb-2 uppercase text-xs">
            Metodologia Utilizada
          </h4>

          {ehNovo ? (
            <p>
              O cálculo executado neste modelo utiliza calendário civil real,
              considerando anos bissextos, operações reais de datas e funções
              de calendário do <strong>date-fns</strong>. As averbações são
              aplicadas apenas como redutoras do tempo necessário, sem criar
              artificialmente novos anos bissextos no passado funcional do
              militar.
            </p>
          ) : (
            <p>
              O cálculo executado neste modelo reproduz o comportamento do
              sistema histórico anterior. O modelo utiliza anos administrativos
              fixos de 365 dias, sem considerar anos bissextos, realizando os
              cálculos através de contagem linear administrativa.
            </p>
          )}
        </div>

        {r17 && (
          <div>
            <h4 className="font-black text-slate-800 mb-2 uppercase text-xs">
              Regra dos 17%
            </h4>

            {ehNovo ? (
              <>
                <p>
                  O sistema calculou inicialmente quando o militar completaria
                  o tempo necessário utilizando calendário civil real.
                </p>

                <p>
                  A data projetada para completar o tempo exigido sem
                  averbações foi:
                  <strong> {formatarDataBR(r17.data30AnosReal)}</strong>.
                </p>

                <p>
                  Nesse período foram contabilizados
                  <strong> {r17.qtdLeapYears || 0} anos bissextos</strong>,
                  totalizando
                  <strong> {r17.diasTotais30Anos} dias reais</strong>.
                </p>

                <p>
                  Após isso, o sistema aplicou as averbações válidas para tempo
                  total, abatendo
                  <strong> {r17.averbacaoTotalDias || 0} dias</strong>.
                </p>

                <p>
                  A nova data-alvo passou a ser
                  <strong> {formatarDataBR(r17.dataAlvoSemPedagio)}</strong>.
                </p>

                <p>
                  Em 31/12/2021 ainda faltavam
                  <strong> {r17.diasFaltantesRef} dias</strong>.
                </p>

                <p>
                  Foi então aplicado o pedágio constitucional de 17%:
                </p>

                <p className="font-bold text-slate-800">
                  {r17.diasFaltantesRef} × 0,17 ={' '}
                  {(r17.diasFaltantesRef * 0.17).toFixed(2)}
                </p>

                <p>
                  O sistema utilizou <strong>Math.round()</strong> para
                  arredondamento, resultando em
                  <strong> {r17.diasPedagio} dias</strong> adicionais.
                </p>

                <p>
                  A data final encontrada pela regra dos 17% foi:
                  <strong> {formatarDataBR(r17.dataFinal)}</strong>.
                </p>
              </>
            ) : (
              <>
                <p>
                  O modelo antigo utiliza contagem administrativa linear de
                  dias, sem considerar anos bissextos.
                </p>

                <p>
                  O sistema calculou o tempo necessário utilizando:
                </p>

                <p className="font-bold text-slate-800">
                  {r17.anosNecessarios || 30} × 365 dias
                </p>

                <p>
                  Em 31/12/2021 o militar possuía tempo administrativo parcial,
                  restando
                  <strong> {r17.diasFaltantes} dias</strong>.
                </p>

                <p>
                  Foi aplicado:
                </p>

                <p className="font-bold text-slate-800">
                  {r17.diasFaltantes} × 1,17 ={' '}
                  {(r17.diasFaltantes * 1.17).toFixed(2)}
                </p>

                <p>
                  O modelo antigo utiliza <strong>Math.floor()</strong>,
                  resultando em
                  <strong> {r17.diasPedagio} dias</strong>.
                </p>

                <p>
                  A data final encontrada foi:
                  <strong> {formatarDataBR(r17.dataFinal)}</strong>.
                </p>
              </>
            )}
          </div>
        )}

        {rt && (
          <div>
            <h4 className="font-black text-slate-800 mb-2 uppercase text-xs">
              Regra da Tabela — 4 Meses por Ano
            </h4>

            <p>
              O sistema calculou inicialmente quando o militar completaria
              25 anos de efetivo serviço.
            </p>

            <p>
              A data encontrada foi:
              <strong> {formatarDataBR(rt.data25Efetivo)}</strong>.
            </p>

            <p>
              Para esse cálculo foram considerados apenas tempos válidos para
              efetivo serviço:
            </p>

            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>tempo CBMPE</li>
              <li>PMPE averbado</li>
              <li>férias não gozadas</li>
            </ul>

            <p className="mt-3">
              O LTIP foi tratado separadamente por reduzir o tempo efetivo de
              serviço operacional.
            </p>

            <p>
              O sistema então verificou quantos anos faltavam entre 2022 e o
              ano em que seriam completados os 25 anos efetivos:
            </p>

            <p className="font-bold text-slate-800">
              {rt.anosFaltantes} × 4 meses
            </p>

            <p>
              Resultando em
              <strong> {rt.mesesPedagio} meses</strong> de pedágio.
            </p>

            <p>
              Esses meses foram adicionados à data-base
              <strong> {formatarDataBR(rt.dataBase)}</strong>.
            </p>

            <p>
              A data final encontrada pela regra da tabela foi:
              <strong> {formatarDataBR(rt.dataFinal)}</strong>.
            </p>
          </div>
        )}

        {er && (
          <div>
            <h4 className="font-black text-slate-800 mb-2 uppercase text-xs">
              Escolha da Requerida
            </h4>

            <p>
              O sistema comparou todas as datas encontradas pelas regras
              aplicáveis.
            </p>

            <p>
              A legislação determina que prevaleça a data mais restritiva ao
              militar.
            </p>

            <p>
              A data final escolhida foi:
              <strong> {formatarDataBR(er.prevaleceu)}</strong>.
            </p>

            {er.motivo && (
              <p>
                Motivo:
                <strong> {er.motivo}</strong>.
              </p>
            )}
          </div>
        )}

        {comp && (
          <div>
            <h4 className="font-black text-slate-800 mb-2 uppercase text-xs">
              Compulsória
            </h4>

            <p>
              O sistema calculou a compulsória considerando:
            </p>

            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>limite etário</li>
              <li>regras especiais de posto</li>
              <li>regra PCNH</li>
              <li>comparação com a requerida</li>
            </ul>

            {comp.idadeLimite && (
              <p className="mt-3">
                Limite etário aplicado:
                <strong> {comp.idadeLimite}</strong>.
              </p>
            )}

            {comp.resultadoFinal && (
              <p>
                Resultado final da compulsória:
                <strong> {formatarDataBR(comp.resultadoFinal)}</strong>.
              </p>
            )}
          </div>
        )}

        {pcnh?.aplicado && (
          <div>
            <h4 className="font-black text-red-700 mb-2 uppercase text-xs">
              Regra Especial — PCNH
            </h4>

            <p>
              O militar possui marcação PCNH.
            </p>

            <p>
              Nessa situação, a compulsória foi recalculada automaticamente
              utilizando:
            </p>

            <p className="font-bold text-slate-800">
              data da última promoção + 2 meses
            </p>

            <p>
              A nova data encontrada foi:
              <strong> {formatarDataBR(pcnh.novaCompulsoria)}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
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
  const corDatas = isAzul ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200';
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

  // ── 2. Regra 17% — suporta NOVO e LEGADO ──
  const r17 = aud?.regra17;
  const r17_diasFaltantes = r17?.diasFaltantes ?? r17?.diasFaltantesRef;
  const blocoRegra17 = r17 ? (
    <Section title="Regra dos 17% (Art. 89-A, I)" accent={corSecAcc}>
      <div className="space-y-1">
        {r17.modelo && <Campo label="Modelo" valor={r17.modelo} />}
        {/* LEGADO — tempo acumulado */}
        {r17.tempoNecessarioAdm && <Campo label="Tempo necessário (adm.)" valor={r17.tempoNecessarioAdm} />}
        {r17.diasCBMPEateRef != null && <Campo label="Dias CBMPE até 31/12/2021" valor={`${r17.diasCBMPEateRef} dias`} />}
        {r17.diasPMPE != null && <Campo label="+ PMPE averbado" valor={`${r17.diasPMPE} dias`} />}
        {r17.diasFFAA != null && <Campo label="+ FFAA averbado" valor={`${r17.diasFFAA} dias`} />}
        {r17.diasINSS != null && <Campo label="+ INSS averbado" valor={`${r17.diasINSS} dias`} />}
        {r17.diasBM != null && <Campo label="+ BM outros estados" valor={`${r17.diasBM} dias`} />}
        {r17.diasPM != null && <Campo label="+ PM outros estados" valor={`${r17.diasPM} dias`} />}
        {r17.diasFeriasNaoGozadas != null && <Campo label="+ Férias não gozadas" valor={`${r17.diasFeriasNaoGozadas} dias`} />}
        {r17.diasLTIP != null && <Campo label="− LTIP" valor={`${r17.diasLTIP} dias`} />}
        {r17.tempoAteReferencia != null && <Campo label="Tempo total até 31/12/2021" valor={`${r17.tempoAteReferencia} dias`} />}
        {/* NOVO — ciclo civil */}
        {r17.anosNecessarios != null && <Campo label="Anos necessários" valor={`${r17.anosNecessarios} anos`} />}
        {r17.data30AnosReal && <Campo label="Data dos anos necessários (ciclo civil real)" valor={fmtS(r17.data30AnosReal)} />}
        {r17.diasTotais30Anos != null && <Campo label="Dias reais no ciclo" valor={`${r17.diasTotais30Anos} dias`} />}
        {r17.diasAdministrativos != null && <Campo label="Dias no modelo adm. (sem anos bissextos)" valor={`${r17.diasAdministrativos} dias`} />}
        {r17.diferencaLeapYears != null && <Campo label="Diferença por anos bissextos" valor={`+${r17.diferencaLeapYears} dias`} />}
        {r17.qtdLeapYears != null && <Campo label="Qtd. de anos bissextos no ciclo" valor={`${r17.qtdLeapYears}`} />}
        {r17.leapYearsNoCiclo?.length > 0 && (
          <Campo label="Anos bissextos contabilizados" valor={r17.leapYearsNoCiclo.join(', ')} />
        )}
        {/* Averbações */}
        {r17.averbacaoTotalDias != null && <Campo label="Averbações totais abatidas" valor={`${r17.averbacaoTotalDias} dias`} />}
        {r17.composicaoTotal && <Campo label="Composição das averbações" valor={r17.composicaoTotal} />}
        {r17.naoEntramNoTotal && <Campo label="Itens excluídos" valor={r17.naoEntramNoTotal} />}
        {r17.diasNecessariosComAverbacao != null && <Campo label="Dias restantes após averbações" valor={`${r17.diasNecessariosComAverbacao} dias`} />}
        {r17.dataAlvoSemPedagio && <Campo label="Nova data-alvo (após averbações)" valor={fmtS(r17.dataAlvoSemPedagio)} />}
        {/* Pedágio */}
        {r17_diasFaltantes != null && <Campo label="Dias faltando em 31/12/2021" valor={`${r17_diasFaltantes} dias`} />}
        {r17.formulaPedagio && <Campo label="Fórmula do pedágio" valor={r17.formulaPedagio} />}
        {r17.arredondamento && <Campo label="Arredondamento aplicado" valor={r17.arredondamento} />}
        {r17.motivoMathRound && <Campo label="Por quê Math.round" valor={r17.motivoMathRound} />}
        {!r17.formulaPedagio && r17.diasPedagio != null && (
          <Campo
            label={`Pedágio (${r17.modelo === 'LEGADO' ? '×1,17 Math.floor' : '×0,17 Math.round'})`}
            valor={r17_diasFaltantes > 0
              ? `${r17_diasFaltantes} × ${r17.modelo === 'LEGADO' ? '1,17' : '0,17'} = ${(r17_diasFaltantes * (r17.modelo === 'LEGADO' ? 1.17 : 0.17)).toFixed(2)} → ${r17.diasPedagio} dias`
              : '0 dias (requisito já cumprido)'}
          />
        )}
        {r17.dataBase && <Campo label="Data-base do pedágio" valor={fmtS(r17.dataBase)} />}
        {r17.dataFinal && <Campo label="Data final do Pedágio 17%" valor={fmtS(r17.dataFinal)} destaque />}
        {r17.observacao && (
          <div className="mt-2 text-xs italic text-slate-500 bg-slate-50 border border-slate-100 rounded p-2">{r17.observacao}</div>
        )}
      </div>
    </Section>
  ) : <Section title="Regra dos 17% (Art. 89-A, I)" accent={corSecAcc}><p className="text-xs text-slate-400 italic">Não aplicável (Pós-Reforma ou Feminino).</p></Section>;

  // ── 3. Regra da Tabela — suporta NOVO e LEGADO ──
  const rt = aud?.regraTabela;
  const blocoTabela = rt ? (
    <Section title="Regra da Tabela — 4 meses por ano (Anexo Único)" accent={corSecAcc}>
      {(rt.aplicavel === false && !rt.data25Efetivo) ? (
        <p className="text-xs text-slate-600 italic">{rt.motivo || 'Inaplicável.'}</p>
      ) : (
        <div className="space-y-1">
          {rt.modelo && <Campo label="Modelo" valor={rt.modelo} />}
          {rt.possui25EfetivoEm31122021 != null && (
            <Campo label="Possuía 25 anos efetivos em 31/12/2021?" valor={rt.possui25EfetivoEm31122021 ? 'Sim' : 'Não'} />
          )}
          {/* LEGADO — dias acumulados */}
          {rt.diasCBMPEateRef != null && <Campo label="Dias CBMPE até 31/12/2021" valor={`${rt.diasCBMPEateRef} dias`} />}
          {rt.diasPMPE != null && <Campo label="+ PMPE" valor={`${rt.diasPMPE} dias`} />}
          {rt.diasFeriasNaoGozadas != null && <Campo label="+ Férias não gozadas" valor={`${rt.diasFeriasNaoGozadas} dias`} />}
          {rt.diasLTIP != null && <Campo label="− LTIP" valor={`${rt.diasLTIP} dias`} />}
          {rt.tempoEfetivoRef != null && <Campo label="Tempo efetivo até 31/12/2021" valor={`${rt.tempoEfetivoRef} dias`} />}
          {rt.tempoEfetivoAdm && <Campo label="Tempo efetivo em anos adm." valor={rt.tempoEfetivoAdm} />}
          {rt.diasParaChegar25 != null && <Campo label="Dias para atingir 25 anos efetivos" valor={`${rt.diasParaChegar25} dias`} />}
          {/* NOVO — composição do efetivo */}
          {rt.entramNoEfetivo && <Campo label="Entram no efetivo" valor={rt.entramNoEfetivo} />}
          {rt.naoEntramNoEfetivo && <Campo label="Não entram no efetivo" valor={rt.naoEntramNoEfetivo} />}
          {rt.motivoLTIP && <Campo label="Por quê LTIP reduz" valor={rt.motivoLTIP} />}
          {rt.motivoFeriasAdicionar && <Campo label="Por quê férias somam" valor={rt.motivoFeriasAdicionar} />}
          {rt.diasEfetivosAverbados != null && <Campo label="Dias efetivos averbados" valor={`${rt.diasEfetivosAverbados} dias`} />}
          {rt.dataIngressoVirtualEfetivo && <Campo label="Ingresso virtual efetivo" valor={fmtS(rt.dataIngressoVirtualEfetivo)} />}
          {/* Data dos 25 anos */}
          {rt.data25Efetivo && <Campo label="Data dos 25 anos efetivos" valor={fmtS(rt.data25Efetivo)} />}
          {rt.diasTotais25Efetivo != null && <Campo label="Dias reais no ciclo efetivo" valor={`${rt.diasTotais25Efetivo} dias`} />}
          {rt.qtdLeapYearsEfetivo != null && <Campo label="anos bissextos no ciclo efetivo" valor={`${rt.qtdLeapYearsEfetivo}`} />}
          {rt.leapYearsNoCicloEfetivo?.length > 0 && (
            <Campo label="Anos bissextos efetivos" valor={rt.leapYearsNoCicloEfetivo.join(', ')} />
          )}
          {/* Anos faltantes */}
          {rt.anosFaltantes != null && (
            <Campo
              label="Anos faltantes (diferença para 2022)"
              valor={rt.formulaAnosFaltantes || (rt.anosFaltantes <= 0 ? `${rt.anosFaltantes} anos (já em 2022 ou antes)` : `${rt.anosFaltantes} anos`)}
            />
          )}
          {rt.tempoTotalRef != null && <Campo label="Tempo total até 31/12/2021" valor={`${rt.tempoTotalRef} dias`} />}
          {rt.anosCompletos != null && <Campo label="Anos completos (adm.) em 31/12/2021" valor={`${rt.anosCompletos} anos`} />}
          {/* Pedágio */}
          {rt.mesesPedagio != null && (
            <Campo
              label="Pedágio (anos × 4 meses, máx 60)"
              valor={rt.formulaPedagio || `${Math.max(rt.anosFaltantes ?? 0, 0)} × 4 = ${rt.mesesPedagio} meses`}
            />
          )}
          {rt.motivoAddMonths && <Campo label="Por quê addMonths" valor={rt.motivoAddMonths} />}
          {rt.dataBase && <Campo label="Data-base (início do pedágio)" valor={fmtS(rt.dataBase)} />}
          {rt.dataFinal && <Campo label="Data final do pedágio" valor={fmtS(rt.dataFinal)} destaque />}
          {rt.data30AnosTotal && <Campo label="Data dos 30 anos totais" valor={fmtS(rt.data30AnosTotal)} />}
          {rt.observacao && (
            <div className="mt-2 text-xs italic text-slate-500 bg-slate-50 border border-slate-100 rounded p-2">{rt.observacao}</div>
          )}
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
        {er.diferencaEntreDatas && <Campo label="Diferença entre as datas" valor={er.diferencaEntreDatas} />}
        {er.observacao && (
          <div className="mt-2 text-xs italic text-slate-500 bg-slate-50 border border-slate-100 rounded p-2">{er.observacao}</div>
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
        {comp?.idadeLimite && <Campo label="Limite de idade" valor={comp.idadeLimite} />}
        {comp?.limiteIdade && <Campo label="Data da compulsória por idade" valor={fmtS(comp.limiteIdade)} />}
        {comp?.anosPosto && <Campo label="Anos no posto (regra especial)" valor={`${comp.anosPosto} anos`} />}
        {comp?.limitePosto && <Campo label="Data da compulsória pelo posto" valor={fmtS(comp.limitePosto)} />}
        {comp?.requeridaBase && <Campo label="Requerida (base de comparação)" valor={fmtS(comp.requeridaBase)} />}
        {comp?.datasIntermediarias?.brutaMinPostoIdade && (
          <Campo label="Bruta [min(posto, idade)]" valor={fmtS(comp.datasIntermediarias.brutaMinPostoIdade)} />
        )}
        {comp?.datasIntermediarias?.maxBrutaRequerida && (
          <Campo label="Pós-ajuste [max(bruta, requerida)]" valor={fmtS(comp.datasIntermediarias.maxBrutaRequerida)} />
        )}
        {comp?.resultadoFinal && <Campo label="Resultado final da compulsória" valor={fmtS(comp.resultadoFinal)} destaque />}
        {comp?.motivo && <Campo label="Motivo" valor={comp.motivo} />}
        {bPCNH?.aplicado && (
          <>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">PCNH Aplicado</div>
            </div>
            <Campo label="Compulsória anterior" valor={fmtS(bPCNH.compulsoriaAnterior)} />
            <Campo label="Última promoção" valor={fmtS(bPCNH.promocao)} />
            <Campo label="Nova compulsória (promoção + 2 meses)" valor={fmtS(bPCNH.novaCompulsoria)} destaque />
            <Campo label="Fórmula" valor={bPCNH.regra} />
            {bPCNH.observacao && (
              <div className="mt-2 text-xs italic text-slate-500 bg-slate-50 border border-slate-100 rounded p-2">{bPCNH.observacao}</div>
            )}
          </>
        )}
      </div>
    </Section>
  ) : null;


  return (
    <div className="rounded border border-slate-300 overflow-hidden">
      <div className={`px-4 py-3 font-black text-base ${corHeader}`}>{label}</div>
      <div className="p-3">
        {blocoResultado}
        {blocoRegra17}
        {blocoTabela}
        {blocoRequerida}
        {blocoCompulsoria}
        <NarrativaCalculo
          aud={aud}
          modelo={isAzul ? 'NOVO' : 'ANTIGO'}
        />
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
