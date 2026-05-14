import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formata um número como moeda BRL. Ex: 1234.5 → "R$ 1.235" */
export function formatBRL(value: number): string {
  return brlFormatter.format(value);
}

/** Retorna a inicial maiúscula de um nome. Usa fallback quando nome é vazio/null. */
export function getInitial(
  nome: string | null | undefined,
  fallback = "?",
): string {
  return (nome ?? fallback).trim().charAt(0).toUpperCase() || fallback;
}
