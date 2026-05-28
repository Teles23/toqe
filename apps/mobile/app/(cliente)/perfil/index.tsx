import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
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
import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { usePullToRefresh } from "@/src/shared/hooks/use-pull-to-refresh";
import { useTheme } from "@/src/shared/theme";
import {
  Avatar,
  CircleIconButton,
  SettingsGroup,
  SettingsListRow,
} from "@/src/shared/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Top N most frequent barbeiros from agendamentos */
function topBarbeiros(
  data: ReturnType<typeof useAgendamentosMeus>["data"],
  n: number,
) {
  if (!data) return [];
  const freq: Record<
    number,
    { usrCodigo: number; nome: string; count: number; ultima: string }
  > = {};
  for (const ag of data) {
    if (!ag.barbeiro) continue;
    const { usrCodigo, nome } = ag.barbeiro;
    if (!freq[usrCodigo]) {
      freq[usrCodigo] = { usrCodigo, nome, count: 0, ultima: ag.inicio };
    }
    freq[usrCodigo]!.count += 1;
    if (ag.inicio > freq[usrCodigo]!.ultima) {
      freq[usrCodigo]!.ultima = ag.inicio;
    }
  }
  return Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  const { palette, radius } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: palette.surfaceHigh,
          borderColor: palette.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: color + "1a" }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  action,
  onAction,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Feather name={icon} size={13} color={palette.textMuted} />
      <Text style={[styles.sectionHeaderText, { color: palette.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      {action ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={styles.sectionHeaderActionWrap}
        >
          <Text
            style={[styles.sectionHeaderAction, { color: palette.textMuted }]}
          >
            {action}
          </Text>
          <Feather name="arrow-right" size={11} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ClientePerfilScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const basePath = usePerfilBasePath();
  const { user, barbearias, barbearia, switchBarbearia, logout } = useAuth();
  const { data, isRefetching, refetch } = useAgendamentosMeus();
  const refreshProps = usePullToRefresh(refetch, isRefetching);

  const go = useCallback(
    (path: string) => router.push(`${basePath}${path}` as never),
    [basePath],
  );

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

  const cortesFeitos =
    data?.filter((a) => a.status === "concluido").length ?? undefined;
  const cortesLabel = cortesFeitos !== undefined ? String(cortesFeitos) : "—";

  const favBarbeiros = useMemo(() => topBarbeiros(data, 3), [data]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          Perfil
        </Text>
        <CircleIconButton
          testID="ir-editar"
          icon="edit-2"
          iconSize={16}
          background="#1c1c1c"
          borderColor="#262626"
          onPress={() => go("/editar")}
          accessibilityLabel="Editar perfil"
        />
      </View>

      <ScrollView
        testID="perfil-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshProps} />}
      >
        {/* ── Identity ── */}
        <View style={styles.identitySection}>
          <Avatar name={user?.nome} uri={user?.avatarUrl} size="lg" />
          <Text style={[styles.userName, { color: palette.text }]}>
            {user?.nome ?? "—"}
          </Text>
          <Text style={[styles.userSubtitle, { color: palette.textDisabled }]}>
            cliente Toqe
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="scissors"
            value={cortesLabel}
            label="Cortes feitos"
            color={palette.primary}
          />
          <StatCard
            icon="home"
            value={String(barbearias.length)}
            label="Barbearias"
            color="#60a5fa"
          />
        </View>

        {/* ── Barbeiros favoritos ── */}
        {favBarbeiros.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader icon="star" label="Barbeiros favoritos" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favScrollContent}
            >
              {favBarbeiros.map((b) => (
                <View
                  key={b.usrCodigo}
                  style={[
                    styles.favBarbeiroCard,
                    {
                      backgroundColor: palette.surfaceHigh,
                      borderColor: palette.border,
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  <Avatar name={b.nome} size="md" />
                  <Text
                    style={[styles.favBarbeiroName, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {b.nome.split(" ")[0]}
                  </Text>
                  <Text
                    style={[
                      styles.favBarbeiroUltima,
                      { color: palette.textDisabled },
                    ]}
                    numberOfLines={1}
                  >
                    última visita
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(cliente)/home" as never)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agendar com ${b.nome}`}
                    style={[
                      styles.favBarbeiroChip,
                      { backgroundColor: palette.primary + "14" },
                    ]}
                  >
                    <Feather name="zap" size={10} color={palette.primary} />
                    <Text
                      style={[
                        styles.favBarbeiroChipText,
                        { color: palette.primary },
                      ]}
                    >
                      Agendar
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Barbearias salvas ── */}
        {barbearias.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader icon="home" label="Barbearias salvas" />
            <View
              style={[
                styles.barbeariasList,
                {
                  backgroundColor: palette.surfaceHigh,
                  borderColor: palette.border,
                  borderRadius: radius.lg,
                },
              ]}
            >
              {barbearias.map((b, idx) => {
                const isAtiva = b.codigo === barbearia?.codigo;
                const isLast = idx === barbearias.length - 1;
                return (
                  <Pressable
                    key={b.codigo}
                    onPress={() => switchBarbearia(b.codigo)}
                    accessibilityRole="button"
                    accessibilityLabel={`Trocar para ${b.nome}`}
                    style={({ pressed }) => [
                      styles.barbeariaRow,
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: palette.border,
                      },
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.barbeariaIcon,
                        {
                          backgroundColor: palette.primary + "14",
                          borderColor: palette.primary + "30",
                        },
                      ]}
                    >
                      <Feather name="home" size={18} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.barbeariaName, { color: palette.text }]}
                        numberOfLines={1}
                      >
                        {b.nome}
                      </Text>
                      {isAtiva ? (
                        <Text
                          style={[
                            styles.barbeariaAtiva,
                            { color: palette.primary },
                          ]}
                        >
                          Ativa
                        </Text>
                      ) : null}
                    </View>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={palette.textDisabled}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Settings ── */}
        <SettingsGroup>
          <SettingsListRow
            icon="bell"
            iconColor={palette.primary}
            title="Lembretes"
            value="1h antes · WhatsApp"
            onTap={() => go("/notificacoes")}
            testID="ir-notificacoes"
          />
          <SettingsListRow icon="mail" title="E-mail" value={user?.email} />
          <SettingsListRow
            icon="phone"
            title="Telefone"
            value={user?.telefone ?? undefined}
          />
          <SettingsListRow
            icon="shield"
            title="Trocar senha"
            onTap={() => go("/senha")}
            testID="ir-senha"
            last
          />
        </SettingsGroup>

        {/* ── Logout ── */}
        <View style={styles.logoutWrap}>
          <Pressable
            testID="btn-logout"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                borderColor: palette.danger + "40",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={16} color={palette.danger} />
            <Text style={[styles.logoutBtnText, { color: palette.danger }]}>
              Sair da conta
            </Text>
          </Pressable>
        </View>

        {/* ── Version ── */}
        <Text style={[styles.versionText, { color: palette.textDisabled }]}>
          Toqe · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    letterSpacing: -0.6,
  },
  // ── Scroll
  scrollContent: {
    paddingBottom: 64,
  },
  // ── Identity
  identitySection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 22,
    gap: 8,
  },
  userName: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  userSubtitle: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
  },
  // ── Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 6,
  },
  // ── Section
  section: {
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  sectionHeaderActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  sectionHeaderAction: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  // ── Fav barbeiros
  favScrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  favBarbeiroCard: {
    width: 108,
    padding: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  favBarbeiroName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  favBarbeiroUltima: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    textAlign: "center",
  },
  favBarbeiroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  favBarbeiroChipText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Barbearias salvas
  barbeariasList: {
    borderWidth: 1,
    overflow: "hidden",
  },
  barbeariaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  barbeariaIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  barbeariaName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  barbeariaAtiva: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  // ── Logout
  logoutWrap: {
    paddingHorizontal: 22,
    marginTop: 6,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Version
  versionText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    marginTop: 16,
  },
});
