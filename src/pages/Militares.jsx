import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Users, AlertTriangle, AlertCircle } from "lucide-react";
import { fetchMilitaresPage, fetchDashboard } from "../services/militarService";
import { getDaysUntil } from "../services/dateUtils";
import DashboardCard from "../components/dashboard/DashboardCard";
import MilitaresFilters from "../components/militares/MilitaresFilters";
import MilitaresTable from "../components/militares/MilitaresTable";
import MilitarDrawer from "../components/militares/MilitarDrawer";

const PAGE_SIZE = 20;

// Lê o filtro de alerta da URL (?alert=critical|warning|all)
function getAlertFilter() {
  const params = new URLSearchParams(window.location.search);
  const a = params.get("alert") || "";
  if (a === "critical") return "vermelho";
  if (a === "warning") return "amarelo";
  return "";
}

const emptyFilters = { matricula: "", nome: "", postoGrad: "" };

export default function Militares() {
  const [militares, setMilitares] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState(null);
  const [stats, setStats] = useState(null);

  const alertFilter = useMemo(() => getAlertFilter(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(filters.matricula && { matricula: filters.matricula }),
        ...(filters.nome && { nome: filters.nome }),
        ...(filters.postoGrad && { postoGrad: filters.postoGrad }),
        ...(alertFilter && { alerta: alertFilter }),
      };

      const result = await fetchMilitaresPage(params);
      setMilitares(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error("Erro ao carregar militares:", err);
    }
    setLoading(false);
  }, [page, filters, alertFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      setStats(data);
    } catch (_) {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Ao mudar filtros, volta pra página 1
  useEffect(() => { setPage(1); }, [filters]);

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
        <DashboardCard
          title="Total de Militares"
          value={loading ? "—" : (stats?.totalMilitares ?? total)}
          icon={Users}
          variant="default"
          onClick={() => handleCardClick("all")}
        />
        <DashboardCard
          title="Reserva em até 3 meses"
          value={loading ? "—" : (stats?.alertaAmarelo ?? "—")}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => handleCardClick("warning")}
        />
        <DashboardCard
          title="Reserva em até 1 mês"
          value={loading ? "—" : (stats?.alertaVermelho ?? "—")}
          icon={AlertCircle}
          variant="critical"
          onClick={() => handleCardClick("critical")}
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Militares</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} militar(es) encontrado(s)
          {alertFilter && (
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
        militares={militares}
        allMilitares={militares}
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