import React, { useState, useEffect } from "react";
import { Loader2, Clock } from "lucide-react";
import { fetchMilitares } from "../services/militarService";
import { fetchAfastamentosByMatricula } from "../services/militarService";

export default function Afastamentos() {
  const [militares, setMilitares] = useState([]);
  const [allAfastamentos, setAllAfastamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const mils = await fetchMilitares();
      setMilitares(mils);
      const afPromises = mils.map((m) => fetchAfastamentosByMatricula(m.matricula));
      const results = await Promise.all(afPromises);
      const all = results.flat();
      setAllAfastamentos(all);
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
        <h1 className="text-2xl font-bold text-foreground">Afastamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allAfastamentos.length} afastamento(s) registrado(s)
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {allAfastamentos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum afastamento registrado.</p>
          </div>
        ) : (
          allAfastamentos.map((af) => (
            <div key={af.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{af.tipo} — {af.dias} dias</p>
                <p className="text-xs text-muted-foreground mt-0.5">{getMilitarNome(af.militar_matricula)}</p>
                {af.processo_sei_militar && (
                  <p className="text-xs text-muted-foreground">SEI: {af.processo_sei_militar}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}