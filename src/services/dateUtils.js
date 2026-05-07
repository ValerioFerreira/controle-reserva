export function getDaysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function getDateAlertLevel(dateStr) {
  const days = getDaysUntil(dateStr);
  if (days <= 30) return "critical";    // vermelho
  if (days <= 90) return "warning";     // amarelo
  return "normal";
}

export function formatDateBR(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}