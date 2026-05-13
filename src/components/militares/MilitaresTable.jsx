import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, ChevronLeft, ChevronRight, Download, CheckCircle2 } from "lucide-react";
import { formatDateBR, getDateAlertLevel } from "../../services/dateUtils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Exportação CSV — adaptada para camelCase
function exportCSV(militares) {
  const headers = ["Matrícula", "Posto/Grad.", "Nome", "Reserva Requerimento", "Reserva Compulsória"];
  const rows = militares.map((m) => [
    m.matricula, m.postoGrad, m.nome,
    formatDateBR(m.reservaRequerimento), formatDateBR(m.reservaCompulsoria),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c || ""}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "militares.csv"; a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(militares) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Militares — Reserva Remunerada", 14, 14);

  const headers = ["Matrícula", "Posto/Grad.", "Nome", "Reserva Requerimento", "Reserva Compulsória"];
  // Adaptado para camelCase
  const rows = militares.map((m) => [
    m.matricula, m.postoGrad, m.nome,
    formatDateBR(m.reservaRequerimento), formatDateBR(m.reservaCompulsoria),
  ]);

  const colWidths = [28, 38, 80, 50, 50];
  const startX = 14;
  let y = 28;
  const rowH = 8;

  doc.setFillColor(180, 30, 30);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let x = startX;
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowH, "F");
    doc.text(h, x + 2, y + 5.5);
    x += colWidths[i];
  });
  y += rowH;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  rows.forEach((row, ri) => {
    if (ri % 2 === 0) { doc.setFillColor(245, 245, 245); } else { doc.setFillColor(255, 255, 255); }
    x = startX;
    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowH, "F");
      doc.rect(x, y, colWidths[i], rowH, "S");
      doc.text(String(cell || ""), x + 2, y + 5.5);
      x += colWidths[i];
    });
    y += rowH;
    if (y > 190) { doc.addPage(); y = 14; }
  });

  doc.save("militares.pdf");
}

// DateBadge usa camelCase (reservaRequerimento / reservaCompulsoria)
function DateBadge({ dateStr }) {
  const level = getDateAlertLevel(dateStr);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
        level === "critical" && "bg-red-100 text-red-700",
        level === "warning" && "bg-yellow-100 text-yellow-700",
        level === "normal" && "text-foreground"
      )}
    >
      {formatDateBR(dateStr)}
    </span>
  );
}

export default function MilitaresTable({ militares, loading, page, totalPages, onPageChange, onEdit, allMilitares }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Matrícula</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Posto/Grad.</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Nome</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Abono</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Reserva Requerimento</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Reserva Compulsória</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {militares.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum militar encontrado.
                </TableCell>
              </TableRow>
            ) : (
              militares.map((m) => (
                <TableRow key={m.matricula} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-sm">{m.matricula}</TableCell>
                  <TableCell>
                    {/* camelCase: postoGrad */}
                    <Badge variant="secondary" className="font-medium text-xs">
                      {m.postoGrad}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{m.nome}</TableCell>
                  <TableCell className="text-center">
                    {m.abonoPermanencia && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sim
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* camelCase: reservaRequerimento */}
                    <DateBadge dateStr={m.reservaRequerimento} />
                  </TableCell>
                  <TableCell>
                    {/* camelCase: reservaCompulsoria */}
                    <DateBadge dateStr={m.reservaCompulsoria} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(m)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: paginação + download */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-4">
        <div className="flex-1 flex justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" />
                Fazer download dos resultados
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => exportPDF(allMilitares || militares)}>
                Baixar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCSV(allMilitares || militares)}>
                Baixar Excel (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 flex justify-center">
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 hidden sm:block"></div>
      </div>
    </div>
  );
}