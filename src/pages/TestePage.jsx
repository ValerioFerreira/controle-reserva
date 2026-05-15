import { useState } from 'react';
import { api } from '@/lib/api'; // Supondo que api é o axios instance exportado

export default function TestePage() {
  const [matricula, setMatricula] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!matricula) return;
    
    setLoading(true);
    setResultado(null);
    setErro(null);

    try {
      const { data } = await api.get(`/militares/auditoria/${matricula}`);
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

  const Section = ({ title, children }) => (
    <div className="mb-6 p-4 border border-slate-200 rounded bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">{title}</h2>
      {children}
    </div>
  );

  const JsonViewer = ({ data }) => (
    <pre className="bg-slate-50 p-3 rounded text-sm overflow-auto text-slate-800 border border-slate-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen font-mono">
      <h1 className="text-2xl font-black mb-6 uppercase text-slate-800">Painel de Auditoria de Cálculos</h1>
      
      <form onSubmit={handleBuscar} className="flex gap-4 mb-8">
        <input 
          type="text" 
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          placeholder="Digite a Matrícula" 
          className="border border-slate-300 p-2 rounded px-4 w-64 uppercase"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calculando...' : 'Calcular Auditoria'}
        </button>
      </form>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Erro: </strong> {erro}
        </div>
      )}

      {resultado && (
        <div>
          <Section title="Datas Finais Encontradas">
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div className="bg-green-50 p-4 border border-green-200 rounded">
                <strong>Requerimento:</strong> {resultado.resultados?.requerimento ? new Date(resultado.resultados.requerimento).toISOString().split('T')[0] : 'N/A'}
              </div>
              <div className="bg-blue-50 p-4 border border-blue-200 rounded">
                <strong>Compulsória:</strong> {resultado.resultados?.compulsoria ? new Date(resultado.resultados.compulsoria).toISOString().split('T')[0] : 'N/A'}
              </div>
            </div>
          </Section>

          <Section title="Precisão Temporal (Logs Matemáticos)">
            <ul className="list-disc pl-6 space-y-2 text-slate-700 bg-yellow-50 p-4 border border-yellow-200 rounded">
              {resultado.auditoria?.precisaoTemporal?.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Dados Base & Averbações">
              <JsonViewer data={resultado.auditoria?.dadosBase} />
            </Section>

            <Section title="Datas Virtuais">
              <JsonViewer data={resultado.auditoria?.temposCalculados} />
            </Section>

            {resultado.auditoria?.regra17 && (
              <Section title="Regra 17% (Transição)">
                <JsonViewer data={resultado.auditoria.regra17} />
              </Section>
            )}

            {resultado.auditoria?.regraTabela && (
              <Section title="Regra da Tabela (Transição)">
                <JsonViewer data={resultado.auditoria.regraTabela} />
              </Section>
            )}

            <Section title="Escolha da Requerida">
              <JsonViewer data={resultado.auditoria?.escolhaRequerida} />
            </Section>

            <Section title="Compulsória">
              <JsonViewer data={resultado.auditoria?.compulsoria} />
            </Section>

            {resultado.auditoria?.pcnh && (
              <Section title="PCNH Aplicado">
                <JsonViewer data={resultado.auditoria.pcnh} />
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
