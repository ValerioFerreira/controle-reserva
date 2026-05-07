import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { logout, getSession } from "../../services/authService";
import { syncGoogleSheets, getSyncStatus } from "../../services/militarService";
import { formatDateBR } from "../../services/dateUtils";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const session = getSession();
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(getSyncStatus());

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncGoogleSheets();
    setSyncInfo(result);
    setSyncing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const lastSyncFormatted = syncInfo.lastSync
    ? new Date(syncInfo.lastSync).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Nunca";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Sync status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          <span>Última sincronização: {lastSyncFormatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="text-xs"
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Sincronizar
        </Button>

        <div className="hidden md:block text-sm text-muted-foreground px-2">
          {session?.nome}
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}