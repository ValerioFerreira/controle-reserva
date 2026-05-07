import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, RefreshCw, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { logout, getSession } from "../../services/authService";
import { syncGoogleSheets } from "../../services/militarService";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const session = getSession();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncGoogleSheets();
      setSyncResult(result);
    } catch (err) {
      setSyncResult({ error: true });
    }
    setSyncing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

        {/* Resultado do sync */}
        {syncResult && !syncResult.error && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>
              Sync: {syncResult.inserted} inseridos, {syncResult.updated} atualizados
              {syncResult.errors?.length > 0 && ` · ${syncResult.errors.length} erro(s)`}
            </span>
          </div>
        )}
        {syncResult?.error && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-red-500">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Falha na sincronização</span>
          </div>
        )}
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