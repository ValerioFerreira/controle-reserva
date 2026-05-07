import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(username, senha);
    if (result?.ok) {
      navigate("/");
    } else {
      setError(result?.message || "Usuário ou senha inválidos.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Sistema de Reserva Remunerada
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Corpo de Bombeiros Militar de Pernambuco
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Usuário</Label>
              <Input
                id="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CBMPE — Diretoria de Gestão de Pessoal
        </p>
      </div>
    </div>
  );
}