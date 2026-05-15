import { renderHook } from "@testing-library/react-native";
import React from "react";

import { AuthContext } from "../../providers/auth-provider";
import { useAuth } from "../use-auth";
import { Perfil } from "@toqe/shared";

const mockAuthValue = {
  user: {
    codigo: 1,
    nome: "João",
    email: "joao@test.com",
    telefone: null,
    avatarUrl: null,
  },
  barbearia: {
    codigo: 10,
    nome: "Barber Shop",
    slug: "barber-shop",
    perfil: Perfil.CLIENTE,
  },
  perfil: Perfil.CLIENTE,
  barbearias: [],
  loading: false,
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
  logout: jest.fn(),
  switchBarbearia: jest.fn(),
};

describe("useAuth", () => {
  it("retorna os valores do AuthContext quando dentro do provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.nome).toBe("João");
    expect(result.current.perfil).toBe(Perfil.CLIENTE);
    expect(result.current.loading).toBe(false);
  });

  it("lança erro quando usado fora do AuthProvider", () => {
    // Suprimir console.error do React durante o teste
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth deve ser usado dentro de <AuthProvider>");

    consoleSpy.mockRestore();
  });

  it("expõe as actions login, logout, switchBarbearia", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
    expect(typeof result.current.switchBarbearia).toBe("function");
  });
});
