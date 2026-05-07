export function diffInDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}
