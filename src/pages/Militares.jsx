import React, { useState, useEffect, useMemo } from "react";
import { Users, AlertTriangle, AlertCircle } from "lucide-react";
import { fetchMilitares } from "../services/militarService";
import { getDaysUntil } from "../services/dateUtils";
import DashboardCard from "../components/dashboard/DashboardCard";
import MilitaresFilters from "../components/militares/MilitaresFilters";
import MilitaresTable from "../components/militares/MilitaresTable";
import MilitarDrawer from "../components/militares/MilitarDrawer";

const PAGE_SIZE = 10;

const emptyFilters = { matricula: "", nome: "", posto_grad: "" };

export default function Militares() {
  const [militares, setMilitares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState(null);

  // Ler filtro de alerta da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const alert = params.get("alert");
    if (alert && alert !== "all") {
      // O filtro de alerta é gerenciado via estado separado
    }
  }, []);

  const alertFilter = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("alert") || "";
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMilitares();
    setMilitares(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const militaresArray = Array.isArray(militares) ? militares : (militares?.data || []);
    let list = [...militaresArray];

    // Filtros de texto
    if (filters.matricula) {
      list = list.filter((m) => m.matricula.includes(filters.matricula));
    }
    if (filters.nome) {
      list = list.filter((m) =>
        m.nome.toLowerCase().includes(filters.nome.toLowerCase())
      );
    }
    if (filters.posto_grad) {
      list = list.filter((m) => m.posto_grad === filters.posto_grad);
    }

    // Filtro de alerta
    if (alertFilter === "critical") {
      list = list.filter((m) => {
        const d = Math.min(getDaysUntil(m.reserva_requerimento), getDaysUntil(m.reserva_compulsoria));
        return d <= 30;
      });
    } else if (alertFilter === "warning") {
      list = list.filter((m) => {
        const d = Math.min(getDaysUntil(m.reserva_requerimento), getDaysUntil(m.reserva_compulsoria));
        return d > 30 && d <= 90;
      });
    }

    return list;
  }, [militares, filters, alertFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filters]);

  const militaresArray = Array.isArray(militares) ? militares : (militares?.data || []);
  const total = militaresArray.length;
  const upTo1Month = militaresArray.filter((m) => Math.min(getDaysUntil(m.reserva_requerimento), getDaysUntil(m.reserva_compulsoria)) <= 30).length;
  const upTo3Months = militaresArray.filter((m) => { const d = Math.min(getDaysUntil(m.reserva_requerimento), getDaysUntil(m.reserva_compulsoria)); return d > 30 && d <= 90; }).length;

  const handleCardClick = (filter) => {
    const url = new URL(window.location.href);
    url.searchParams.set("alert", filter);
    window.history.pushState({}, "", url);
    window.location.reload();
  };

  const handleEdit = (m) => {
    setSelectedMatricula(m.matricula);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard title="Total de Militares" value={loading ? "—" : total} icon={Users} variant="default" onClick={() => handleCardClick("all")} />
        <DashboardCard title="Reserva em até 3 meses" value={loading ? "—" : upTo3Months} icon={AlertTriangle} variant="warning" onClick={() => handleCardClick("warning")} />
        <DashboardCard title="Reserva em até 1 mês" value={loading ? "—" : upTo1Month} icon={AlertCircle} variant="critical" onClick={() => handleCardClick("critical")} />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Militares</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} militar(es) encontrado(s)
          {alertFilter && alertFilter !== "all" && (
            <span className="ml-2 text-primary font-medium">
              — Filtro de alerta ativo
            </span>
          )}
        </p>
      </div>

      <MilitaresFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ ...emptyFilters })}
      />

      <MilitaresTable
        militares={paginated}
        allMilitares={filtered}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleEdit}
      />

      <MilitarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        matricula={selectedMatricula}
        onDataChanged={loadData}
      />
    </div>
  );
}