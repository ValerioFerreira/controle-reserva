import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { fetchDashboard } from "../services/militarService";
import DashboardCard from "../components/dashboard/DashboardCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCardClick = (filter) => {
    navigate(`/militares?alert=${filter}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da reserva remunerada
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Total de Militares"
          value={stats?.totalMilitares ?? "—"}
          icon={Users}
          variant="default"
          onClick={() => handleCardClick("all")}
        />
        <DashboardCard
          title="Reserva em até 3 meses"
          value={stats?.alertaAmarelo ?? "—"}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => handleCardClick("warning")}
        />
        <DashboardCard
          title="Reserva em até 1 mês"
          value={stats?.alertaVermelho ?? "—"}
          icon={AlertCircle}
          variant="critical"
          onClick={() => handleCardClick("critical")}
        />
      </div>
    </div>
  );
}