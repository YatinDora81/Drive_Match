export function formatInr(amount: number): string {
  const rupees = Math.round(amount);
  if (rupees < 1e5) return `₹${groupIndian(rupees)}`;

  const lakh = short(amount / 1e5);
  return lakh >= 100 ? `₹${short(amount / 1e7)} Cr` : `₹${lakh} L`;
}

export const formatLakh = (amount: number): string =>
  `₹${short(amount / 1e5)} lakh`;

export const formatKm = (km: number): string => `${groupIndian(km)} km`;

export function groupIndian(n: number): string {
  const digits = String(Math.round(n));
  if (digits.length <= 3) return digits;

  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${head},${digits.slice(-3)}`;
}

const short = (n: number): number => Math.round(n * 10) / 10;
