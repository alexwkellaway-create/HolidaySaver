import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (shadcn/ui helper) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as GBP currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Return a human-readable relative time string ("2 days ago", "just now") */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Return a motivational message based on % progress towards target */
export function progressMessage(pct: number): string {
  if (pct === 0) return "Every journey starts with the first £ — go on! 🚀";
  if (pct < 10) return "Off to a flying start! Keep it going ✈️";
  if (pct < 25) return "The adventure begins! Every £ counts 🌍";
  if (pct < 50) return `${pct.toFixed(0)}% there — halfway to cocktails! 🍹`;
  if (pct < 75) return "Over halfway! You can practically smell the sunscreen ☀️";
  if (pct < 90) return "Almost there! Dust off those suitcases 🧳";
  if (pct < 100) return "SO close! Final push — the pool is waiting 🏊";
  return "TARGET HIT! 🎉 Time to book those flights!";
}

/** Return milestone thresholds that trigger confetti */
export const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Validate a monetary amount:
 * - Must be a positive number
 * - Max 2 decimal places
 * - Reasonable upper bound (£50,000 per contribution)
 */
export function validateAmount(value: unknown): { valid: boolean; error?: string } {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return { valid: false, error: "Amount must be a positive number" };
  if (n > 50_000) return { valid: false, error: "Amount cannot exceed £50,000" };
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim()))
    return { valid: false, error: "Amount can have at most 2 decimal places" };
  return { valid: true };
}
