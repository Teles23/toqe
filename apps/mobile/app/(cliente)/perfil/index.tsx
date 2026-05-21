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
import { useTheme } from "@/src/shared/theme";

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
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "1a" }]}>
        <Text style={styles.statIconText}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  action,
  onAction,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label.toUpperCase()}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.sectionHeaderAction}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onTap,
  testID,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onTap?: () => void;
  testID?: string;
  danger?: boolean;
}) {
  const { palette } = useTheme();

  const inner = (
    <View style={styles.settingsRow}>
      <View
        style={[
          styles.settingsRowIcon,
          { backgroundColor: danger ? palette.danger + "1a" : "#F4B40014" },
        ]}
      >
        <Text style={styles.settingsRowIconText}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.settingsRowLabel,
          { color: danger ? palette.danger : palette.text },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={styles.settingsRowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onTap ? <Text style={styles.settingsRowChevron}>›</Text> : null}
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
        {inner}
      </Pressable>
    );
  }
  return <View testID={testID}>{inner}</View>;
}

// ─── SettingsGroup ────────────────────────────────────────────────────────────

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingsGroup}>{children}</View>;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ClientePerfilScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const basePath = usePerfilBasePath();
  const { user, barbearias, barbearia, switchBarbearia, logout } = useAuth();
  const { data, isRefetching, refetch } = useAgendamentosMeus();

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

  const initial = user?.nome ? user.nome.charAt(0).toUpperCase() : "?";

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          Perfil
        </Text>
        <Pressable
          testID="ir-editar"
          onPress={() => go("/editar")}
          accessibilityRole="button"
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </Pressable>
      </View>

      <ScrollView
        testID="perfil-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
      >
        {/* ── Identity ── */}
        <View style={styles.identitySection}>
          <View
            style={[styles.avatarCircle, { backgroundColor: palette.primary }]}
          >
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={[styles.userName, { color: palette.text }]}>
            {user?.nome ?? "—"}
          </Text>
          <Text style={styles.userSubtitle}>cliente Toqe</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="✂"
            value={cortesLabel}
            label="Cortes feitos"
            color="#F4B400"
          />
          <StatCard
            icon="🏠"
            value={String(barbearias.length)}
            label="Barbearias"
            color="#60a5fa"
          />
        </View>

        {/* ── Barbeiros favoritos ── */}
        {favBarbeiros.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader label="Barbeiros favoritos" action="Ver todos" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favScrollContent}
            >
              {favBarbeiros.map((b) => {
                const bInitial = b.nome.charAt(0).toUpperCase();
                return (
                  <View key={b.usrCodigo} style={styles.favBarbeiroCard}>
                    <View
                      style={[
                        styles.favBarbeiroAvatar,
                        { backgroundColor: palette.primary },
                      ]}
                    >
                      <Text style={styles.favBarbeiroAvatarLetter}>
                        {bInitial}
                      </Text>
                    </View>
                    <Text
                      style={[styles.favBarbeiroName, { color: palette.text }]}
                      numberOfLines={1}
                    >
                      {b.nome.split(" ")[0]}
                    </Text>
                    <Text style={styles.favBarbeiroUltima} numberOfLines={1}>
                      última visita
                    </Text>
                    <Pressable
                      onPress={() => router.push("/(cliente)/home" as never)}
                      accessibilityRole="button"
                      style={styles.favBarbeiroChip}
                    >
                      <Text
                        style={[
                          styles.favBarbeiroChipText,
                          { color: palette.primary },
                        ]}
                      >
                        ✨ Agendar
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Barbearias salvas ── */}
        {barbearias.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader label="Barbearias salvas" />
            <View style={styles.barbeariasList}>
              {barbearias.map((b, idx) => {
                const isAtiva = b.codigo === barbearia?.codigo;
                return (
                  <Pressable
                    key={b.codigo}
                    onPress={() => switchBarbearia(b.codigo)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.barbeariaRow,
                      idx < barbearias.length - 1
                        ? styles.barbeariaRowSep
                        : null,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.barbeariaIcon,
                        {
                          backgroundColor: "#F4B40014",
                          borderColor: "#F4B40030",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>🏠</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.barbeariaName, { color: palette.text }]}
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
                    <Text style={styles.barbeariaChevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Settings rows ── */}
        <View style={styles.section}>
          <SettingsGroup>
            <SettingsRow
              icon="🔔"
              label="Lembretes"
              onTap={() => go("/notificacoes")}
              testID="ir-notificacoes"
            />
            <View style={styles.settingsInternalSep} />
            <SettingsRow icon="📧" label="E-mail" value={user?.email} />
            <View style={styles.settingsInternalSep} />
            <SettingsRow icon="📱" label="Telefone" />
            <View style={styles.settingsInternalSep} />
            <SettingsRow
              icon="🔒"
              label="Trocar senha"
              onTap={() => go("/senha")}
              testID="ir-senha"
            />
          </SettingsGroup>
        </View>

        {/* ── Logout ── */}
        <View style={[styles.section, { marginTop: 6 }]}>
          <Pressable
            testID="btn-logout"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: palette.danger, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.logoutBtnText, { color: palette.danger }]}>
              Sair da conta
            </Text>
          </Pressable>
        </View>

        {/* ── Version ── */}
        <Text style={styles.versionText}>Toqe · v1.0.0</Text>
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
  editBtnText: {
    fontSize: 16,
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
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
    color: "#0d0d0d",
  },
  userName: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  userSubtitle: {
    fontSize: 11,
    color: "#666666",
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
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262626",
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statIconText: {
    fontSize: 16,
  },
  statValue: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 10,
    color: "#666666",
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
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 10,
    color: "#666666",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionHeaderAction: {
    fontSize: 11,
    color: "#F4B400",
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
    backgroundColor: "#171717",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    gap: 6,
  },
  favBarbeiroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  favBarbeiroAvatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 20,
    color: "#0d0d0d",
  },
  favBarbeiroName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  favBarbeiroUltima: {
    fontSize: 10,
    color: "#666666",
    fontFamily: "JetBrainsMono_400Regular",
    textAlign: "center",
  },
  favBarbeiroChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F4B40014",
    borderRadius: 6,
  },
  favBarbeiroChipText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Barbearias salvas
  barbeariasList: {
    backgroundColor: "#171717",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#262626",
    overflow: "hidden",
  },
  barbeariaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#171717",
  },
  barbeariaRowSep: {
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
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
  barbeariaChevron: {
    fontSize: 14,
    color: "#666666",
  },
  // ── Settings group
  settingsGroup: {
    backgroundColor: "#171717",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#262626",
    overflow: "hidden",
  },
  settingsInternalSep: {
    height: 1,
    backgroundColor: "#262626",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: "#171717",
    gap: 10,
  },
  settingsRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingsRowIconText: {
    fontSize: 14,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  settingsRowValue: {
    fontSize: 11,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    maxWidth: 120,
  },
  settingsRowChevron: {
    fontSize: 14,
    color: "#666666",
    flexShrink: 0,
  },
  // ── Logout
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Version
  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#444444",
    fontFamily: "JetBrainsMono_400Regular",
    marginTop: 8,
  },
});
