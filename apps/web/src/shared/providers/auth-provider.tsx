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
import {
  requestLogin,
  requestLogout,
  request2FaVerify,
  TwoFaRequiredError,
} from "@/features/auth/services/auth.service";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AuthUser {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  twoFaEnabled: boolean;
  /** true apenas para o fundador/operador interno da plataforma */
  superAdmin: boolean;
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
  /** Autentica com e-mail/senha. Lança TwoFaRequiredError se 2FA for necessário. */
  login: (email: string, senha: string) => Promise<void>;
  /** Completa o login após verificação TOTP. Seta estado e redireciona. */
  verifyTwoFa: (tempToken: string, code: string) => Promise<void>;
  /**
   * Estabelece a sessão a partir de cookies já setados pelo BFF (ex: auto-login
   * após aceite de convite). Apenas recarrega `/usuarios/me` para o estado
   * global — **não** redireciona (a tela chamadora controla a navegação).
   */
  establishSession: () => Promise<void>;
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
          twoFaEnabled,
          superAdmin,
          barbearias: bars,
        } = me;
        setUser({
          codigo,
          nome,
          email,
          telefone,
          avatarUrl,
          twoFaEnabled: twoFaEnabled ?? false,
          superAdmin: superAdmin ?? false,
        });
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

  // Recarrega `/usuarios/me` e popula o estado global. `email` é usado como
  // fallback quando a resposta não traz o e-mail (ex: 2FA verify sem e-mail).
  // Retorna `superAdmin` para que o chamador decida o destino de navegação.
  const loadMeState = useCallback(async (email: string): Promise<boolean> => {
    const me: UsuarioMe = await api.get("/usuarios/me");
    const {
      codigo,
      nome,
      email: meEmail,
      telefone,
      avatarUrl,
      twoFaEnabled,
      superAdmin,
      barbearias: bars,
    } = me;
    setUser({
      codigo,
      nome,
      email: email || meEmail,
      telefone,
      avatarUrl,
      twoFaEnabled: twoFaEnabled ?? false,
      superAdmin: superAdmin ?? false,
    });
    setBarbearias(bars);
    if (bars.length > 0) {
      setBarbearia(bars[0]!);
      setPerfil(bars[0]!.perfil);
    }
    return superAdmin ?? false;
  }, []);

  const loadMe = useCallback(
    async (email: string) => {
      const superAdmin = await loadMeState(email);

      // Super admin vai para o painel interno; usuários normais para o dashboard
      if (superAdmin) {
        router.push("/admin");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("redirect") ?? "/dashboard");
    },
    [router, loadMeState],
  );

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, senha: string) => {
      const result = await requestLogin({ email, senha });
      if (result?.requiresTwoFa) {
        throw new TwoFaRequiredError(result.tempToken);
      }
      await loadMe(email);
    },
    [loadMe],
  );

  // ── Verify 2FA (completa login após OTP) ──────────────────────────────────
  const verifyTwoFa = useCallback(
    async (tempToken: string, code: string) => {
      await request2FaVerify(tempToken, code);
      await loadMe("");
    },
    [loadMe],
  );

  // ── Establish session (auto-login: cookies já setados pelo BFF) ────────────
  const establishSession = useCallback(async () => {
    await loadMeState("");
    setLoading(false);
  }, [loadMeState]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await requestLogout();
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
      verifyTwoFa,
      establishSession,
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
      verifyTwoFa,
      establishSession,
      logout,
      switchBarbearia,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
