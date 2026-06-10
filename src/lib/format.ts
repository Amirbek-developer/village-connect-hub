export function formatPrice(price: number | null | undefined, unit?: string | null): string {
  if (price == null) return "Kelishuv";
  const s = new Intl.NumberFormat("uz-UZ").format(price);
  return unit ? `${s} so'm / ${unit}` : `${s} so'm`;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "hozir";
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} kun oldin`;
  return d.toLocaleDateString("uz-UZ");
}
