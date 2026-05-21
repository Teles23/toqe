import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePerfilBasePath } from "@/src/features/perfil/use-perfil-base-path";
import { useAgendamentosMeus } from "@/src/shared/hooks/cliente/use-agendamentos-meus";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { Avatar } from "@/src/shared/ui";

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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  value: string;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  const { palette, typography, spacing, radius } = useTheme();
  return (
    <View
      style={[
        statStyles.card,
        {
          flex: 1,
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.md,
          alignItems: "center",
        },
      ]}
    >
      <Text style={[typography.heading, { color: palette.primary }]}>
        {value}
      </Text>
      <Text
        style={[
          typography.captionBold,
          { color: palette.textMuted, textAlign: "center", letterSpacing: 0.5 },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({ card: {} });

interface SettingsRowProps {
  title: string;
  value?: string;
  onTap?: () => void;
  testID?: string;
  last?: boolean;
}

function SettingsRow({
  title,
  value,
  onTap,
  testID,
  last = false,
}: SettingsRowProps) {
  const { typography, palette, spacing, radius } = useTheme();
  const inner = (
    <View
      style={[
        srStyles.row,
        {
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          marginBottom: last ? 0 : spacing.sm,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[typography.label, { color: palette.text }]}>{title}</Text>
        {value ? (
          <Text
            style={[typography.caption, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {onTap ? (
        <Text style={{ color: palette.textMuted, fontSize: 16 }}>›</Text>
      ) : null}
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
  return (
    <View testID={testID} accessibilityRole="none">
      {inner}
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

/**
 * Tela de perfil do cliente — Urban Flow v2.
 * Layout: identity → stats → barbeiros favoritos → barbearias salvas → settings → logout
 */
export default function ClientePerfilScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const basePath = usePerfilBasePath();
  const { user, barbearias, barbearia, switchBarbearia, logout } = useAuth();
  const { data } = useAgendamentosMeus();

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

  // Use criadoEm from barbearia member — not available directly from auth,
  // so we skip it gracefully
  const membroHa: string | null = null;

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
          },
        ]}
      >
        <Text style={[typography.title, { color: palette.text }]}>Perfil</Text>
        <Pressable
          testID="ir-editar"
          onPress={() => go("/editar")}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ color: palette.primary, fontSize: 16 }}>✏️</Text>
        </Pressable>
      </View>

      <ScrollView
        testID="perfil-scroll"
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      >
        {/* ── Identity ── */}
        <View
          style={[
            styles.hero,
            { paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
          ]}
        >
          <Avatar name={user?.nome} size="lg" />
          <Text
            style={[
              typography.heading,
              {
                color: palette.text,
                marginTop: spacing.sm,
                textAlign: "center",
              },
            ]}
          >
            {user?.nome ?? "—"}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: palette.textMuted, marginTop: 2, textAlign: "center" },
            ]}
          >
            cliente Toqe
            {membroHa ? ` · ${membroHa}` : ""}
          </Text>
        </View>

        {/* ── Stats ── */}
        <View
          style={[
            styles.statsRow,
            {
              paddingHorizontal: spacing.md,
              marginBottom: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          <StatCard value={cortesLabel} label="Cortes feitos" />
          <StatCard value={String(barbearias.length)} label="Barbearias" />
        </View>

        {/* ── Barbeiros favoritos ── */}
        {favBarbeiros.length > 0 ? (
          <View style={{ marginBottom: spacing.md }}>
            <Text
              style={[
                typography.captionBold,
                {
                  color: palette.textMuted,
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                  marginLeft: spacing.md + 4,
                },
              ]}
            >
              BARBEIROS FAVORITOS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.md,
                gap: spacing.sm,
              }}
            >
              {favBarbeiros.map((b) => (
                <View
                  key={b.usrCodigo}
                  style={[
                    styles.barbCard,
                    {
                      backgroundColor: palette.surface,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: spacing.md,
                      alignItems: "center",
                      width: 120,
                    },
                  ]}
                >
                  <Avatar name={b.nome} size="md" />
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: palette.text,
                        marginTop: spacing.xs,
                        textAlign: "center",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {b.nome.split(" ")[0]}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: palette.textMuted, textAlign: "center" },
                    ]}
                    numberOfLines={1}
                  >
                    última visita
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(cliente)/home" as never)}
                    accessibilityRole="button"
                    style={[
                      styles.agendarChip,
                      {
                        marginTop: spacing.xs,
                        backgroundColor: palette.primary,
                        borderRadius: radius.full,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 3,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.captionBold,
                        { color: palette.primaryOn },
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
          <View
            style={{ marginBottom: spacing.md, paddingHorizontal: spacing.md }}
          >
            <Text
              style={[
                typography.captionBold,
                {
                  color: palette.textMuted,
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                  marginLeft: 4,
                },
              ]}
            >
              BARBEARIAS SALVAS
            </Text>
            <View
              style={{
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.border,
                overflow: "hidden",
              }}
            >
              {barbearias.map((b, idx) => {
                const isAtiva = b.codigo === barbearia?.codigo;
                return (
                  <Pressable
                    key={b.codigo}
                    onPress={() => switchBarbearia(b.codigo)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.barbeariaRow,
                      {
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 4,
                        borderBottomWidth: idx < barbearias.length - 1 ? 1 : 0,
                        borderBottomColor: palette.border,
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: palette.surface,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16, marginRight: spacing.sm }}>
                      🏠
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.label, { color: palette.text }]}>
                        {b.nome}
                      </Text>
                      {isAtiva ? (
                        <Text
                          style={[
                            typography.caption,
                            { color: palette.primary },
                          ]}
                        >
                          Ativa
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ color: palette.textMuted, fontSize: 16 }}>
                      ›
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Settings rows ── */}
        <View
          style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}
        >
          <SettingsRow
            title="Lembretes"
            onTap={() => go("/notificacoes")}
            testID="ir-notificacoes"
          />
          <SettingsRow title="E-mail" value={user?.email} />
          <SettingsRow title="Telefone" />
          <SettingsRow
            title="Trocar senha"
            onTap={() => go("/senha")}
            testID="ir-senha"
            last
          />
        </View>

        {/* ── Logout ── */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <Pressable
            testID="btn-logout"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.danger,
                padding: spacing.md,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                { color: palette.danger, textAlign: "center" },
              ]}
            >
              Sair da conta
            </Text>
          </Pressable>
        </View>

        {/* ── Version footer ── */}
        <Text
          style={[
            typography.caption,
            {
              color: palette.textDisabled,
              textAlign: "center",
              marginTop: spacing.xl,
            },
          ]}
        >
          Toqe · v1.0.0
        </Text>
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
  hero: { alignItems: "center" },
  statsRow: { flexDirection: "row" },
  barbCard: {},
  agendarChip: {},
  barbeariaRow: { flexDirection: "row", alignItems: "center" },
  logoutBtn: {},
});
