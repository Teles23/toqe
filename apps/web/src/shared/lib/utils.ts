import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Retorna a inicial maiúscula de um nome. Usa fallback quando nome é vazio/null. */
export function getInitial(
  nome: string | null | undefined,
  fallback = "?",
): string {
  return (nome ?? fallback).trim().charAt(0).toUpperCase() || fallback;
}
