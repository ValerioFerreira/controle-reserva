import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { POSTOS_GRADUACOES } from "../../services/mockData";

export default function MilitaresFilters({ filters, onChange, onClear }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

        <Select
          value={filters.posto_grad || "all"}
          onValueChange={(v) => update("posto_grad", v === "all" ? "" : v)}
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

        <Button variant="outline" onClick={onClear} className="h-10">
          <X className="w-4 h-4 mr-1.5" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
}