import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats technical identifiers like 'google_drive' or 'CamelCaseString' 
 * into human-readable labels like 'Google Drive' or 'Camel Case String'.
 */
export function formatLabel(str: string) {
  if (!str) return '';
  
  // 1. Handle snake_case or SCREAMING_SNAKE_CASE
  let formatted = str.replace(/_/g, ' ');
  
  // 2. Handle CamelCase (add space before uppercase letters, but not at start)
  formatted = formatted.replace(/([A-Z])/g, ' $1');
  
  // 3. Trim extra spaces and capitalize first letter
  formatted = formatted.trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(/  +/g, ' ');
}
