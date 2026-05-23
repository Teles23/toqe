/**
 * PerfilIndexScreen — Perfil do Barbeiro (Urban Flow v2).
 *
 * Redesign pixel-accurate do protótipo Claude Design:
 *  - Identity hero: Avatar 72×72 + nome Sora 700 20px + "barbeiro · Barbearia" 12px #888888
 *  - Stats "Este mês": grid 3-col #171717 borderRadius 14
 *    - Cortes: #F4B400, Faturamento: #22c55e, Ticket médio: #60a5fa
 *    - Rodapé 10px #444444 com ticket médio + no-shows
 *  - SettingsGroup: label 10px uppercase #666666 letterSpacing 2
 *    - Container: bg #171717 borderRadius 14 borderWidth 1 borderColor #262626
 *  - SettingsRow: IconBox 36×36 borderRadius 10 + title 13px + value 11px + chevron
 *  - Grupos: AGENDA (Jornada + Serviços + Convites) + CONTA (E-mail + Senha)
 */

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { type ReactNode, useCallback } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePerfilBasePath } from "@/src/features/perfil/use-perfil-base-path";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useCompartilharLink } from "@/src/shared/hooks/use-compartilhar-link";
import { usePullToRefresh } from "@/src/shared/hooks/use-pull-to-refresh";
import { useBarbeiroStats } from "@/src/shared/hooks/barbeiro/use-barbeiro-stats";
import { useTheme } from "@/src/shared/theme";
import { Avatar, Divider, SkeletonBox } from "@/src/shared/ui";

// ─── PerfilStat ───────────────────────────────────────────────────────────────

interface PerfilStatProps {
  value: string;
  label: string;
  color: string;
}

function PerfilStat({ value, label, color }: PerfilStatProps) {
  return (
    <View style={statStyles.col}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  col: { flex: 1, alignItems: "center", gap: 4 },
  value: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    letterSpacing: -0.55,
    lineHeight: 26,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#888888",
    letterSpacing: 9 * 0.12,
    textTransform: "uppercase",
    textAlign: "center",
  },
});

// ─── SettingsGroup ────────────────────────────────────────────────────────────

interface SettingsGroupProps {
  label: string;
  children: ReactNode;
}

function SettingsGroup({ label, children }: SettingsGroupProps) {
  return (
    <View style={groupStyles.wrap}>
      <Text style={groupStyles.label}>{label}</Text>
      <View style={groupStyles.container}>{children}</View>
    </View>
  );
}

const groupStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#666666",
    letterSpacing: 10 * 0.2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  container: {
    backgroundColor: "#171717",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#262626",
  },
});

// ─── SettingsRow ──────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  title: string;
  value?: string;
  onTap?: () => void;
  last?: boolean;
  testID?: string;
  trailing?: ReactNode;
}

function SettingsRow({
  icon,
  iconColor = "#888888",
  title,
  value,
  onTap,
  last = false,
  testID,
  trailing,
}: SettingsRowProps) {
  const { palette } = useTheme();

  const content = (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      {icon && (
        <View
          style={[
            rowStyles.iconBox,
            {
              backgroundColor: iconColor + "14",
              borderColor: iconColor + "30",
            },
          ]}
        >
          <Feather name={icon} size={16} color={iconColor} />
        </View>
      )}
      <View style={rowStyles.textWrap}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {title}
        </Text>
        {value ? (
          <Text style={rowStyles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onTap ? (
          <Text style={[rowStyles.chevron, { color: palette.textDisabled }]}>
            ›
          </Text>
        ) : null)}
    </View>
  );

  if (onTap) {
    return (
      <Pressable
        testID={testID}
        onPress={onTap}
        accessibilityRole="button"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} accessibilityRole="none">
      {content}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 0,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#f5f5f5",
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#888888",
    marginTop: 2,
  },
  chevron: {
    fontSize: 14,
    marginLeft: 8,
    flexShrink: 0,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  barbeiro: "barbeiro",
  dono: "Dono",
  admin: "Admin",
};

/**
 * Tela principal de perfil do barbeiro — Urban Flow v2.
 *
 * Mantém testIDs existentes:
 * perfil-scroll, ir-editar, ir-jornada, ir-servicos, ir-senha, btn-logout
 * barbearia-{codigo}
 */
export default function PerfilIndexScreen() {
  const { palette, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const basePath = usePerfilBasePath();
  const { user, perfil, barbearias, barbearia, switchBarbearia, logout } =
    useAuth();
  const compartilharLink = useCompartilharLink();
  const {
    data: barbeiroStats,
    isLoading: statsLoading,
    isRefetching: statsRefetching,
    refetch: refetchStats,
  } = useBarbeiroStats();
  const refreshProps = usePullToRefresh(refetchStats, statsRefetching);

  const handleLogout = useCallback(() => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  }, [logout]);

  const go = useCallback(
    (path: string) => router.push(`${basePath}${path}` as never),
    [basePath],
  );

  const roleLabel = perfil ? (ROLE_LABEL[perfil] ?? perfil) : "barbeiro";
  const temMultiBarbearia = barbearias.length > 1;

  // Formatar valores de stats
  const faturamentoStr =
    barbeiroStats?.faturamento != null
      ? `R$ ${Math.round(barbeiroStats.faturamento).toLocaleString("pt-BR")}`
      : "—";
  const ticketStr =
    barbeiroStats?.ticketMedio != null
      ? `R$ ${Math.round(barbeiroStats.ticketMedio).toLocaleString("pt-BR")}`
      : "—";
  const cortesStr =
    barbeiroStats?.atendimentos != null
      ? String(barbeiroStats.atendimentos)
      : "—";
  const presencaStr =
    barbeiroStats?.presenca != null
      ? `${Math.round(barbeiroStats.presenca)}%`
      : "—";
  const noShowStr =
    barbeiroStats?.presenca != null
      ? String(Math.round(100 - barbeiroStats.presenca))
      : "0";

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.md,
            paddingTop: insets.top + 10,
            paddingBottom: spacing.sm,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Perfil</Text>
        <Pressable
          testID="ir-editar"
          onPress={() => go("/editar")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="edit-2" size={16} color="#888888" />
        </Pressable>
      </View>

      <ScrollView
        testID="perfil-scroll"
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshProps} />}
      >
        {/* ── Identity hero ── */}
        <View
          style={[
            styles.hero,
            { paddingTop: 12, paddingBottom: 6, paddingHorizontal: spacing.md },
          ]}
        >
          <Avatar name={user?.nome} size="lg" />
          <Text style={[styles.heroName, { marginTop: 10 }]}>
            {user?.nome ?? "—"}
          </Text>
          <Text style={styles.heroRole}>
            {roleLabel}
            {barbearia ? ` · ${barbearia.nome}` : ""}
          </Text>
          {user?.linkPublico ? (
            <Pressable
              testID="btn-copiar-link"
              accessibilityRole="button"
              accessibilityLabel="Copiar link público"
              onPress={() => compartilharLink(user.linkPublico!)}
              style={({ pressed }) => [
                styles.urlPill,
                {
                  marginTop: spacing.sm,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: palette.primary + "38",
                  backgroundColor: palette.primary + "14",
                  paddingHorizontal: spacing.md,
                  paddingVertical: 7,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.urlPillText, { color: palette.primary }]}>
                {user.linkPublico}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ── Stats "Este mês" ── */}
        {statsLoading ? (
          <View
            style={[
              styles.statsCard,
              { marginHorizontal: spacing.md, marginBottom: 16 },
            ]}
          >
            <SkeletonBox width="100%" height={60} />
          </View>
        ) : (
          <View
            style={[
              styles.statsCard,
              { marginHorizontal: spacing.md, marginBottom: 16 },
            ]}
          >
            {/* Label seção */}
            <View style={styles.statsLabelRow}>
              <Text style={styles.statsLabel}>ESTE MÊS</Text>
              <Text style={styles.statsSubLabel}>
                {new Date().toLocaleDateString("pt-BR", { month: "long" })} ·{" "}
                {new Date().getDate()} dias
              </Text>
            </View>
            {/* Grid 3-col */}
            <View style={styles.statsGrid}>
              <PerfilStat
                value={cortesStr}
                label="Atendimentos"
                color="#F4B400"
              />
              <PerfilStat
                value={faturamentoStr}
                label="Faturado"
                color="#22c55e"
              />
              <PerfilStat
                value={presencaStr}
                label="Presença"
                color="#60a5fa"
              />
            </View>
            {/* Rodapé */}
            <Text style={styles.statsFooter}>
              Ticket médio {ticketStr} · {noShowStr} faltas este mês
            </Text>
          </View>
        )}

        {/* ── SUA AGENDA ── */}
        <SettingsGroup label="Sua agenda">
          <SettingsRow
            icon="clock"
            iconColor="#F4B400"
            title="Jornada de trabalho"
            value="Seg-Sex · Sáb"
            onTap={() => go("/jornada")}
            testID="ir-jornada"
          />
          <SettingsRow
            icon="scissors"
            iconColor="#a78bfa"
            title="Serviços e preços"
            onTap={() => go("/servicos")}
            testID="ir-servicos"
          />
          <SettingsRow
            icon="link"
            iconColor="#3b82f6"
            title="Convites"
            onTap={() => go("/notificacoes")}
            testID="ir-notificacoes"
            last
          />
        </SettingsGroup>

        {/* ── NOTIFICAÇÕES (display) ── */}
        <SettingsGroup label="Notificações">
          <SettingsRow
            icon="bell"
            iconColor="#F4B400"
            title="Push notifications"
            value="Ligado"
          />
          <SettingsRow
            icon="message-circle"
            iconColor="#22c55e"
            title="WhatsApp"
            value="Confirmações + lembretes"
            last
          />
        </SettingsGroup>

        {/* ── CONTA ── */}
        <SettingsGroup label="Conta">
          {user?.email ? (
            <SettingsRow
              icon="mail"
              iconColor="#888888"
              title="E-mail"
              value={user.email}
              testID="ir-email"
            />
          ) : null}
          {user?.telefone ? (
            <SettingsRow
              icon="phone"
              iconColor="#888888"
              title="Telefone"
              value={user.telefone}
            />
          ) : null}
          <SettingsRow
            icon="shield"
            iconColor="#888888"
            title="Segurança"
            onTap={() => go("/2fa")}
            testID="ir-2fa"
          />
          <SettingsRow
            icon="key"
            iconColor="#888888"
            title="Mudar senha"
            onTap={() => go("/senha")}
            testID="ir-senha"
            last
          />
        </SettingsGroup>

        {/* ── BARBEARIA (multi) ── */}
        {temMultiBarbearia ? (
          <SettingsGroup label="Barbearia ativa">
            {barbearias.map((b, idx) => {
              const isAtiva = b.codigo === barbearia?.codigo;
              return (
                <View key={b.codigo}>
                  {idx > 0 ? <Divider indent={16} /> : null}
                  <SettingsRow
                    title={b.nome}
                    value={isAtiva ? "Ativa" : undefined}
                    onTap={() => switchBarbearia(b.codigo)}
                    testID={`barbearia-${b.codigo}`}
                    trailing={
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: isAtiva ? palette.primary : "#262626",
                            backgroundColor: isAtiva
                              ? palette.primary
                              : "transparent",
                          },
                        ]}
                      />
                    }
                    last={idx === barbearias.length - 1}
                  />
                </View>
              );
            })}
          </SettingsGroup>
        ) : null}

        {/* ── Logout ── */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <Pressable
            testID="btn-logout"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>
        </View>

        {/* ── Version ── */}
        <Text style={styles.version}>Toqe · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#f5f5f5",
    letterSpacing: -0.5,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
  },
  heroName: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    color: "#f5f5f5",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 4,
  },
  heroRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
  },
  urlPill: {},
  urlPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  // Stats card
  statsCard: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 14,
  },
  statsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#666666",
    letterSpacing: 10 * 0.15,
    textTransform: "uppercase",
  },
  statsSubLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "#444444",
    marginLeft: "auto",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statsFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#444444",
    marginTop: 10,
    paddingHorizontal: 4,
  },
  // Radio (multi-barbearia)
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  // Logout
  logoutBtn: {
    width: "100%",
    padding: 14,
    marginTop: 6,
    minHeight: 48,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ef444440",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#ef4444",
  },
  version: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: "#444444",
    textAlign: "center",
    marginTop: 16,
  },
});
