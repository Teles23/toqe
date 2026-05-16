import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { Perfil } from "@toqe/shared";
import type { AuthContextValue } from "@/shared/providers/auth-provider";

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

export const mockAuthContext: AuthContextValue = {
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
    perfil: Perfil.DONO,
  },
  barbearias: [
    {
      codigo: 1,
      nome: "Test Barbearia",
      slug: "test",
      perfil: Perfil.DONO,
    },
  ],
  perfil: Perfil.DONO,
  loading: false,
  login: vi.fn(),
  verifyTwoFa: vi.fn(),
  logout: vi.fn(),
  switchBarbearia: vi.fn(),
};
