import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

export const mockAuthContext = {
  user: {
    codigo: 1,
    nome: "Test User",
    email: "test@test.com",
    telefone: null,
    avatarUrl: null,
  },
  barbearia: {
    codigo: 1,
    nome: "Test Barbearia",
    slug: "test",
    perfil: "dono" as const,
  },
  barbearias: [
    {
      codigo: 1,
      nome: "Test Barbearia",
      slug: "test",
      perfil: "dono" as const,
    },
  ],
  perfil: "dono" as const,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  switchBarbearia: vi.fn(),
};
