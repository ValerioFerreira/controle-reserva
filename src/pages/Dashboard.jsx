import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { fetchMilitares } from "../services/militarService";
import { getDaysUntil } from "../services/dateUtils";
import DashboardCard from "../components/dashboard/DashboardCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [militares, setMilitares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilitares().then((data) => {
      setMilitares(data);
      setLoading(false);
    });
  }, []);

  const militaresArray = Array.isArray(militares) ? militares : (militares?.data || []);
  const total = militaresArray.length;

  const upTo1Month = militaresArray.filter((m) => {
    const dReq = getDaysUntil(m.reserva_requerimento);
    const dComp = getDaysUntil(m.reserva_compulsoria);
    return Math.min(dReq, dComp) <= 30;
  }).length;

  const upTo3Months = militaresArray.filter((m) => {
    const dReq = getDaysUntil(m.reserva_requerimento);
    const dComp = getDaysUntil(m.reserva_compulsoria);
    const minDays = Math.min(dReq, dComp);
    return minDays > 30 && minDays <= 90;
  }).length;

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
          value={total}
          icon={Users}
          variant="default"
          onClick={() => handleCardClick("all")}
        />
        <DashboardCard
          title="Reserva em até 3 meses"
          value={upTo3Months}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => handleCardClick("warning")}
        />
        <DashboardCard
          title="Reserva em até 1 mês"
          value={upTo1Month}
          icon={AlertCircle}
          variant="critical"
          onClick={() => handleCardClick("critical")}
        />
      </div>
    </div>
  );
}