import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateLinkToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

export function getBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function formatDate(date: Date | string, lang: "zh" | "en" = "zh"): string {
  const d = new Date(date);
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
