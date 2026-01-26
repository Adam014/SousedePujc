import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities for Czech locale
export function formatDateCZ(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString("cs-CZ")
}

export function formatDateRangeCZ(start: Date | string, end: Date | string): string {
  return `${formatDateCZ(start)} - ${formatDateCZ(end)}`
}

export function formatDateTimeCZ(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString("cs-CZ")
}
