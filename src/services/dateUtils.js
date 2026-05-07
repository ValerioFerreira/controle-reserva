/**
 * Utilitários de data
 * Suporta tanto ISO datetime (Prisma) quanto strings simples YYYY-MM-DD
 */

export function getDaysUntil(dateInput) {
  if (!dateInput) return Infinity;
  // Aceita Date, ISO datetime ou YYYY-MM-DD
  const target = new Date(dateInput);
  if (isNaN(target.getTime())) return Infinity;
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function getDateAlertLevel(dateInput) {
  const days = getDaysUntil(dateInput);
  if (days <= 30) return "critical";  // vermelho
  if (days <= 90) return "warning";   // amarelo
  return "normal";
}

export function formatDateBR(dateInput) {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  // Formatar como DD/MM/YYYY usando UTC para evitar deslocamento de fuso
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}