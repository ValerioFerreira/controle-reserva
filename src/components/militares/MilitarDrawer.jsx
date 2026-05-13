import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDateBR } from "../../services/dateUtils";
import { fetchMilitarByMatricula, updateAbono } from "../../services/militarService";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AverbacoesCrud from "./AverbacoesCrud";
import AfastamentosCrud from "./AfastamentosCrud";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function MilitarDrawer({ open, onClose, matricula, onDataChanged }) {
  const [militar, setMilitar] = useState(null);
  const [loading, setLoading] = useState(false);

  const [abono, setAbono] = useState(false);
  const [dataAbono, setDataAbono] = useState("");
  const [savingAbono, setSavingAbono] = useState(false);

  const loadMilitar = async () => {
    if (!matricula) return;
    setLoading(true);
    const data = await fetchMilitarByMatricula(matricula);
    setMilitar(data);
    setAbono(data?.abonoPermanencia || false);
    setDataAbono(data?.dataInicioAbono ? data.dataInicioAbono.split("T")[0] : "");
    setLoading(false);
  };

  useEffect(() => {
    if (open && matricula) {
      loadMilitar();
    }
  }, [open, matricula]);

  const handleCrudChange = async () => {
    await loadMilitar();
    onDataChanged?.();
  };

  const handleSaveAbono = async () => {
    setSavingAbono(true);
    try {
      await updateAbono(matricula, {
        abonoPermanencia: abono,
        dataInicioAbono: abono && dataAbono ? new Date(dataAbono).toISOString() : null,
      });
      await loadMilitar();
      onDataChanged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAbono(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">
            {loading ? "Carregando..." : militar?.nome || "Militar"}
          </SheetTitle>
          {/* camelCase: postoGrad */}
          {militar && (
            <Badge variant="secondary" className="w-fit">{militar.postoGrad}</Badge>
          )}
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : militar ? (
          <Tabs defaultValue="dados" className="mt-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
              <TabsTrigger value="averbacoes" className="text-xs">Averbações</TabsTrigger>
              <TabsTrigger value="afastamentos" className="text-xs">Afastamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4 space-y-0">
              <div className="bg-muted/50 rounded-lg p-4">
                <InfoRow label="Matrícula" value={militar.matricula} />
                <InfoRow label="Nome" value={militar.nome} />
                {/* camelCase: postoGrad, sexo, dataIngresso, dataUltimaPromocao, dataNascimento */}
                <InfoRow label="Posto/Graduação" value={militar.postoGrad} />
                <InfoRow label="Sexo" value={militar.sexo === "M" ? "Masculino" : "Feminino"} />
                <InfoRow label="Data de Ingresso" value={formatDateBR(militar.dataIngresso)} />
                <InfoRow label="Última Promoção" value={formatDateBR(militar.dataUltimaPromocao)} />
                <InfoRow label="Data de Nascimento" value={formatDateBR(militar.dataNascimento)} />
              </div>

              <div className="mt-4 bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">Previsões de Reserva</h4>
                {/* camelCase: reservaRequerimento, reservaCompulsoria */}
                <InfoRow label="Reserva por Requerimento" value={formatDateBR(militar.reservaRequerimento)} />
                <div className="flex justify-between py-2 border-b border-border/50 last:border-0 items-center">
                  <span className="text-sm text-muted-foreground">Reserva Compulsória</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDateBR(militar.reservaCompulsoria)}</span>
                    {militar.pcnh && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider">
                        PCNH
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Abono Permanência</h4>
                  <Button size="sm" onClick={handleSaveAbono} disabled={savingAbono}>
                    {savingAbono ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="abono-checkbox" 
                    checked={abono} 
                    onCheckedChange={(c) => setAbono(c)} 
                  />
                  <label htmlFor="abono-checkbox" className="text-sm font-medium leading-none cursor-pointer">
                    Em Abono Permanência
                  </label>
                </div>
                {abono && (
                  <div className="space-y-1 mt-3">
                    <label className="text-xs font-medium text-muted-foreground">Data de Início do Abono</label>
                    <Input 
                      type="date" 
                      value={dataAbono} 
                      onChange={(e) => setDataAbono(e.target.value)}
                      className="w-full sm:max-w-[200px]"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="averbacoes" className="mt-4">
              <AverbacoesCrud matricula={militar.matricula} onChange={handleCrudChange} />
            </TabsContent>

            <TabsContent value="afastamentos" className="mt-4">
              <AfastamentosCrud matricula={militar.matricula} onChange={handleCrudChange} />
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}