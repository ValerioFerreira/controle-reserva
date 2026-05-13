import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

// Postos/graduações definidos localmente (sem dependência de mockData)
const POSTOS_GRADUACOES = [
  "Cel", "Cel Promo. Req.", "Ten Cel", "Ten Cel Promo. Req.",
  "Maj QOC", "Maj QOA", "Cap QOA", "1ºTen QOC", "1ºTen QOA",
  "2ºTen QOC", "2ºTen QOA", "Aspirante", "Subten", "Subten Promo. Req.",
  "1ºSgt", "2ºSgt", "3ºSgt", "Cb", "Sd",
];

export default function MilitaresFilters({ filters, onChange, onClear }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Matrícula"
            value={filters.matricula}
            onChange={(e) => update("matricula", e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nome"
            value={filters.nome}
            onChange={(e) => update("nome", e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Campo renomeado: postoGrad (camelCase) em vez de posto_grad */}
        <Select
          value={filters.postoGrad || "all"}
          onValueChange={(v) => update("postoGrad", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Posto/Graduação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {POSTOS_GRADUACOES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.abono || "all"}
          onValueChange={(v) => update("abono", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Abono Permanência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos (Abono)</SelectItem>
            <SelectItem value="com_abono">Com Abono</SelectItem>
            <SelectItem value="sem_abono">Sem Abono</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onClear} className="h-10">
          <X className="w-4 h-4 mr-1.5" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
}