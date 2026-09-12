import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}${Date.now().toString(36)}`;
}
