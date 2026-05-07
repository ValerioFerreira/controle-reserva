import React, { useState, useEffect } from "react";
import { Loader2, FileText } from "lucide-react";
import { fetchMilitares } from "../services/militarService";
import { fetchAverbacoesByMatricula } from "../services/militarService";

export default function Averbacoes() {
  const [militares, setMilitares] = useState([]);
  const [allAverbacoes, setAllAverbacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const mils = await fetchMilitares();
      setMilitares(mils);
      const avPromises = mils.map((m) => fetchAverbacoesByMatricula(m.matricula));
      // Nota: fetchAverbacoesByMatricula usa militar_matricula na entity
      const results = await Promise.all(avPromises);
      const all = results.flat();
      setAllAverbacoes(all);
      setLoading(false);
    };
    load();
  }, []);

  const getMilitarNome = (mat) => {
    const m = militares.find((x) => x.matricula === mat);
    return m ? `${m.posto_grad} ${m.nome}` : mat;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Averbações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allAverbacoes.length} averbação(ões) registrada(s)
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {allAverbacoes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma averbação registrada.</p>
          </div>
        ) : (
          allAverbacoes.map((av) => (
            <div key={av.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{av.tipo} — {av.dias} dias</p>
                <p className="text-xs text-muted-foreground mt-0.5">{getMilitarNome(av.militar_matricula)}</p>
                {av.processo_sei_militar && (
                  <p className="text-xs text-muted-foreground">SEI: {av.processo_sei_militar}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}