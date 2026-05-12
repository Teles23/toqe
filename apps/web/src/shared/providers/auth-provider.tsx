"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { BarbeariaResumo, Perfil, UsuarioMe } from "@toqe/shared";
import { api } from "@/shared/api/api-client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AuthUser {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  /** Dados do usuário logado. null = não autenticado. */
  user: AuthUser | null;
  /** Barbearia ativa no momento */
  barbearia: BarbeariaResumo | null;
  /** Perfil/role do usuário na barbearia ativa */
  perfil: Perfil | null;
  /** Todas as barbearias que o usuário pertence */
  barbearias: BarbeariaResumo[];
  /** true enquanto carrega a sessão inicial */
  loading: boolean;
}

interface AuthActions {
  /** Autentica com e-mail/senha. Chama o BFF /api/auth/login. */
  login: (email: string, senha: string) => Promise<void>;
  /** Encerra a sessão. */
  logout: () => Promise<void>;
  /** Troca a barbearia ativa (multi-tenant). */
  switchBarbearia: (barCodigo: number) => void;
}

export type AuthContextValue = AuthState & AuthActions;

// ─── Context ──────────────────────────────────────────────────────────────────
// Exportado para o hook `useAuth` em `@/shared/hooks/use-auth` (separação SRP).

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.JSX.Element {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [barbearias, setBarbearias] = useState<BarbeariaResumo[]>([]);
  const [barbearia, setBarbearia] = useState<BarbeariaResumo | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Carrega a sessão ao montar (GET /usuarios/me) ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const me = await api.get<UsuarioMe>("/usuarios/me", {
          redirectOn401: false,
        });
        if (cancelled) return;

        const {
          codigo,
          nome,
          email,
          telefone,
          avatarUrl,
          barbearias: bars,
        } = me;
        setUser({ codigo, nome, email, telefone, avatarUrl });
        setBarbearias(bars);

        // Seleciona a primeira barbearia como ativa (por padrão)
        if (bars.length > 0) {
          setBarbearia(bars[0]!);
          setPerfil(bars[0]!.perfil);
        }
      } catch {
        // Sem sessão válida — estado permanece null
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, senha: string) => {
      // Chama o BFF que seta os cookies httpOnly e retorna os dados do usuário
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ?? "Credenciais inválidas",
        );
      }

      const me: UsuarioMe = await api.get("/usuarios/me");
      const { codigo, nome, telefone, avatarUrl, barbearias: bars } = me;

      setUser({ codigo, nome, email, telefone, avatarUrl });
      setBarbearias(bars);

      if (bars.length > 0) {
        setBarbearia(bars[0]!);
        setPerfil(bars[0]!.perfil);
      }

      // Redireciona para dashboard (ou para onde veio)
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") ?? "/dashboard";
      router.push(redirect);
    },
    [router],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setBarbearias([]);
      setBarbearia(null);
      setPerfil(null);
      router.push("/login");
    }
  }, [router]);

  // ── Switch barbearia ───────────────────────────────────────────────────────
  const switchBarbearia = useCallback(
    (barCodigo: number) => {
      const found = barbearias.find((b) => b.codigo === barCodigo);
      if (found) {
        setBarbearia(found);
        setPerfil(found.perfil);
      }
    },
    [barbearias],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      barbearia,
      barbearias,
      perfil,
      loading,
      login,
      logout,
      switchBarbearia,
    }),
    [
      user,
      barbearia,
      barbearias,
      perfil,
      loading,
      login,
      logout,
      switchBarbearia,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
