import { router } from "expo-router";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { api, ApiError } from "@/src/shared/api/api-client";
import { TokenStorage } from "@/src/shared/lib/secure-storage";
import type { BarbeariaResumo, UsuarioMe } from "@toqe/shared";
import { Perfil } from "@toqe/shared";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AuthUser {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  dataNascimento: string | null;
  /** Link público compartilhável (derivado no backend a partir do nome). */
  linkPublico: string | null;
}

interface AuthState {
  user: AuthUser | null;
  barbearia: BarbeariaResumo | null;
  perfil: Perfil | null;
  barbearias: BarbeariaResumo[];
  loading: boolean;
}

interface AuthActions {
  login(email: string, senha: string): Promise<void>;
  loginWithGoogle(idToken: string): Promise<void>;
  /**
   * Estabelece a sessão a partir de tokens já emitidos (ex.: auto-login após
   * aceitar convite). Salva os tokens, carrega o usuário e atualiza o estado —
   * SEM redirecionar (o chamador decide o destino). Retorna o perfil ativo.
   */
  establishSession(
    accessToken: string,
    refreshToken: string,
  ): Promise<Perfil | null>;
  /** Recarrega /usuarios/me e atualiza o estado global (ex: após upload de avatar). */
  reloadUser(): Promise<void>;
  logout(): Promise<void>;
  switchBarbearia(codigo: number): void;
}

export type AuthContextValue = AuthState & AuthActions;

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BARBEIRO_PERFIS: Perfil[] = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

// Usuário autenticado sem vínculo de barbearia (ex: primeiro login via Google,
// ainda não convidado por nenhuma barbearia) cai em cliente/home por default.
// Espelha a regra de app/index.tsx — perfil de equipe vai pra agenda do barbeiro,
// qualquer outro caso (CLIENTE explícito ou sem vínculo) vai pra cliente/home.
function getRedirectForPerfil(perfil: Perfil | null): string {
  return perfil && BARBEIRO_PERFIS.includes(perfil)
    ? "/(barbeiro)/agenda"
    : "/(cliente)/home";
}

function buildUser(me: UsuarioMe): AuthUser {
  return {
    codigo: me.codigo,
    nome: me.nome,
    email: me.email,
    telefone: me.telefone,
    avatarUrl: me.avatarUrl,
    linkPublico: me.linkPublico ?? null,
    dataNascimento: me.dataNascimento ?? null,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    barbearia: null,
    perfil: null,
    barbearias: [],
    loading: true,
  });

  // Busca dados do usuário autenticado e atualiza estado
  const loadMe = useCallback(async (): Promise<boolean> => {
    try {
      const me = await api.get<UsuarioMe>("/usuarios/me", {
        skipRefresh: false,
      });
      const primeiraBarbearia = me.barbearias[0] ?? null;
      setState((prev) => ({
        ...prev,
        user: buildUser(me),
        barbearias: me.barbearias,
        barbearia: primeiraBarbearia,
        perfil: primeiraBarbearia?.perfil ?? null,
        loading: false,
      }));
      return true;
    } catch (e) {
      // 401 (token inválido / usuário inativo): limpa tokens e redireciona
      // para login em vez de deixar o app preso em estado indefinido.
      if (e instanceof ApiError && e.status === 401) {
        await TokenStorage.clearTokens();
        setState((prev) => ({ ...prev, loading: false }));
        router.replace("/(auth)/login");
        return false;
      }
      setState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  // Restaura sessão ao iniciar o app
  useEffect(() => {
    void (async () => {
      const token = await TokenStorage.getAccessToken();
      if (!token) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      await loadMe();
    })();
  }, [loadMe]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const establishSession = useCallback(
    async (
      accessToken: string,
      refreshToken: string,
    ): Promise<Perfil | null> => {
      await TokenStorage.saveTokens(accessToken, refreshToken);

      const me = await api.get<UsuarioMe>("/usuarios/me");
      const primeiraBarbearia = me.barbearias[0] ?? null;

      setState({
        user: buildUser(me),
        barbearias: me.barbearias,
        barbearia: primeiraBarbearia,
        perfil: primeiraBarbearia?.perfil ?? null,
        loading: false,
      });

      return primeiraBarbearia?.perfil ?? null;
    },
    [],
  );

  const login = useCallback(
    async (email: string, senha: string): Promise<void> => {
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", { email, senha }, { skipRefresh: true });

      const perfil = await establishSession(
        data.access_token,
        data.refresh_token,
      );

      router.replace(getRedirectForPerfil(perfil) as never);
    },
    [establishSession],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string): Promise<void> => {
      // Endpoint /auth/google: backend verifica o idToken via google-auth-library
      // (DI: ver apps/api/src/auth/google-token-verifier.ts) e emite tokens reais.
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/google", { idToken }, { skipRefresh: true });

      const perfil = await establishSession(
        data.access_token,
        data.refresh_token,
      );

      router.replace(getRedirectForPerfil(perfil) as never);
    },
    [establishSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }, { skipRefresh: true });
      }
    } catch (err) {
      // Ignora erros de rede no logout — limpa tokens de qualquer forma
      if (!(err instanceof ApiError)) throw err;
    } finally {
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignora — usuário pode não ter entrado via Google
      }
      await TokenStorage.clearTokens();
      setState({
        user: null,
        barbearia: null,
        perfil: null,
        barbearias: [],
        loading: false,
      });
      router.replace("/(auth)/login");
    }
  }, []);

  const reloadUser = useCallback(async (): Promise<void> => {
    await loadMe();
  }, [loadMe]);

  const switchBarbearia = useCallback((codigo: number) => {
    setState((prev) => {
      const barbearia =
        prev.barbearias.find((b) => b.codigo === codigo) ?? null;
      return {
        ...prev,
        barbearia,
        perfil: barbearia?.perfil ?? null,
      };
    });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithGoogle,
    establishSession,
    reloadUser,
    logout,
    switchBarbearia,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
