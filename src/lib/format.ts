// Currency + number formatting. Markt prices are in Nigerian naira (₦).

/** Format an amount as naira, e.g. 24000 -> "₦24,000.00". */
export function formatNaira(amount: number | null | undefined): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
