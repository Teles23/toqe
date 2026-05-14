import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, AuthContext } from "./auth-provider";
import type { AuthContextValue } from "./auth-provider";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/services/auth.service", () => ({
  requestLogin: vi.fn(),
  requestLogout: vi.fn(),
}));

vi.mock("@/shared/api/api-client", () => ({
  api: {
    get: vi.fn(),
  },
  barbeariaApi: vi.fn(),
}));

import { api } from "@/shared/api/api-client";
import {
  requestLogin,
  requestLogout,
} from "@/features/auth/services/auth.service";

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };
const mockRequestLogin = requestLogin as ReturnType<typeof vi.fn>;
const mockRequestLogout = requestLogout as ReturnType<typeof vi.fn>;

const mockMe = {
  codigo: 1,
  nome: "Test User",
  email: "test@test.com",
  telefone: null,
  avatarUrl: null,
  barbearias: [
    {
      codigo: 1,
      nome: "BarberShop",
      slug: "barbershop",
      perfil: "dono" as const,
    },
  ],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function captureContext(): { current: AuthContextValue | null } {
  const ref = { current: null as AuthContextValue | null };

  function Capture() {
    const ctx = React.useContext(AuthContext);
    ref.current = ctx;
    return null;
  }

  render(
    <AuthProvider>
      <Capture />
    </AuthProvider>,
  );

  return ref;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockPush.mockReset();
});

describe("AuthProvider — session load", () => {
  it("carrega sessão ao montar e seta user/barbearia", async () => {
    mockApi.get.mockResolvedValueOnce(mockMe);

    const ref = captureContext();

    await waitFor(() => expect(ref.current?.loading).toBe(false));

    expect(ref.current?.user?.nome).toBe("Test User");
    expect(ref.current?.barbearia?.nome).toBe("BarberShop");
    expect(ref.current?.perfil).toBe("dono");
  });

  it("permanece null quando /usuarios/me rejeita (sem sessão)", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("401"));

    const ref = captureContext();

    await waitFor(() => expect(ref.current?.loading).toBe(false));

    expect(ref.current?.user).toBeNull();
    expect(ref.current?.barbearia).toBeNull();
  });
});

describe("AuthProvider — login", () => {
  it("chama requestLogin e depois /usuarios/me, depois redireciona", async () => {
    mockApi.get
      .mockRejectedValueOnce(new Error("sem sessão")) // load inicial
      .mockResolvedValueOnce(mockMe); // após login

    mockRequestLogin.mockResolvedValueOnce(undefined);

    const ref = captureContext();
    await waitFor(() => expect(ref.current?.loading).toBe(false));

    await act(async () => {
      await ref.current?.login("test@test.com", "senha123");
    });

    expect(mockRequestLogin).toHaveBeenCalledWith({
      email: "test@test.com",
      senha: "senha123",
    });
    expect(ref.current?.user?.email).toBe("test@test.com");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("AuthProvider — logout", () => {
  it("chama requestLogout e limpa estado", async () => {
    mockApi.get.mockResolvedValueOnce(mockMe);
    mockRequestLogout.mockResolvedValueOnce(undefined);

    const ref = captureContext();
    await waitFor(() => expect(ref.current?.user).not.toBeNull());

    await act(async () => {
      await ref.current?.logout();
    });

    expect(mockRequestLogout).toHaveBeenCalled();
    expect(ref.current?.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("limpa estado mesmo quando requestLogout falha", async () => {
    mockApi.get.mockResolvedValueOnce(mockMe);
    mockRequestLogout.mockImplementationOnce(() =>
      Promise.reject(new Error("network")),
    );

    const ref = captureContext();
    await waitFor(() => expect(ref.current?.user).not.toBeNull());

    // logout usa try/finally — rejeita mas ainda limpa o estado
    await act(async () => {
      await ref.current?.logout().catch(() => {});
    });

    expect(ref.current?.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});

describe("AuthProvider — switchBarbearia", () => {
  it("atualiza barbearia e perfil ativa", async () => {
    const me = {
      ...mockMe,
      barbearias: [
        {
          codigo: 1,
          nome: "BarberShop",
          slug: "barbershop",
          perfil: "dono" as const,
        },
        {
          codigo: 2,
          nome: "OutraShop",
          slug: "outra",
          perfil: "barbeiro" as const,
        },
      ],
    };
    mockApi.get.mockResolvedValueOnce(me);

    const ref = captureContext();
    await waitFor(() => expect(ref.current?.barbearia?.codigo).toBe(1));

    act(() => {
      ref.current?.switchBarbearia(2);
    });

    expect(ref.current?.barbearia?.codigo).toBe(2);
    expect(ref.current?.perfil).toBe("barbeiro");
  });

  it("ignora código inválido sem mudar barbearia", async () => {
    mockApi.get.mockResolvedValueOnce(mockMe);

    const ref = captureContext();
    await waitFor(() => expect(ref.current?.barbearia?.codigo).toBe(1));

    act(() => {
      ref.current?.switchBarbearia(999);
    });

    expect(ref.current?.barbearia?.codigo).toBe(1);
  });
});
