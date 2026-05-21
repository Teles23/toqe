import { router } from "expo-router";
import { type ReactNode, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePerfilBasePath } from "@/src/features/perfil/use-perfil-base-path";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useBarbeiroStats } from "@/src/shared/hooks/barbeiro/use-barbeiro-stats";
import { useTheme } from "@/src/shared/theme";
import { Avatar, Divider, SkeletonBox } from "@/src/shared/ui";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PerfilStatProps {
  value: string;
  label: string;
  color?: string;
  smaller?: boolean;
}

function PerfilStat({ value, label, color, smaller = false }: PerfilStatProps) {
  const { typography, palette } = useTheme();
  return (
    <View style={statStyles.col}>
      <Text
        style={[
          smaller ? typography.subheading : typography.heading,
          { color: color ?? palette.text, textAlign: "center" },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          typography.captionBold,
          { color: palette.textMuted, textAlign: "center", letterSpacing: 0.8 },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  col: { flex: 1, alignItems: "center", gap: 2 },
});

interface SettingsGroupProps {
  label: string;
  children: ReactNode;
}

function SettingsGroup({ label, children }: SettingsGroupProps) {
  const { typography, palette, spacing, radius } = useTheme();
  return (
    <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.md }}>
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
        {label}
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
        {children}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  icon?: string;
  iconColor?: string;
  title: string;
  value?: string;
  onTap?: () => void;
  last?: boolean;
  testID?: string;
  trailing?: ReactNode;
}

function SettingsRow({
  title,
  value,
  onTap,
  last = false,
  testID,
  trailing,
}: SettingsRowProps) {
  const { typography, palette, spacing } = useTheme();
  const content = (
    <View
      style={[
        rowStyles.row,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: palette.border,
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
      {trailing ??
        (onTap ? (
          <Text style={{ color: palette.textMuted, fontSize: 16 }}>›</Text>
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
  row: { flexDirection: "row", alignItems: "center" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  barbeiro: "Barbeiro",
  dono: "Dono",
  admin: "Admin",
};

/**
 * Tela principal de perfil do barbeiro — Urban Flow v2.
 *
 * Layout: identity hero → stats mensais → SUA AGENDA → NOTIFICAÇÕES → CONTA → logout
 *
 * Os testIDs existentes são mantidos para retrocompatibilidade com os testes:
 * perfil-scroll, ir-editar, ir-senha, ir-2fa, ir-sessoes, ir-notificacoes
 * barbearia-{codigo}
 */
export default function PerfilIndexScreen() {
  const { palette, spacing, typography, radius } = useTheme();
  const basePath = usePerfilBasePath();
  const { user, perfil, barbearias, barbearia, switchBarbearia, logout } =
    useAuth();
  const { data: stats, isLoading: statsLoading } = useBarbeiroStats();

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

  const roleLabel = perfil ? (ROLE_LABEL[perfil] ?? perfil) : "Barbeiro";
  const temMultiBarbearia = barbearias.length > 1;

  const fmt = (n: number, prefix = "") =>
    `${prefix}${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
        {/* ── Identity hero ── */}
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
            {roleLabel}
            {barbearia ? ` · ${barbearia.nome}` : ""}
          </Text>
          {barbearia?.slug ? (
            <Pressable
              style={[
                styles.urlPill,
                {
                  marginTop: spacing.sm,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: palette.primary,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={[typography.captionBold, { color: palette.primary }]}
              >
                toqe.app/u/{barbearia.slug}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ── Stats mensais ── */}
        {statsLoading ? (
          <View
            style={[
              styles.statsCard,
              {
                marginHorizontal: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.border,
                padding: spacing.md,
                gap: spacing.sm,
              },
            ]}
          >
            <SkeletonBox width="100%" height={60} />
          </View>
        ) : stats ? (
          <View
            style={[
              styles.statsCard,
              {
                marginHorizontal: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.border,
                padding: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                typography.captionBold,
                {
                  color: palette.textMuted,
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              ESTE MÊS
            </Text>
            <View style={styles.statsRow}>
              <PerfilStat
                value={fmt(stats.atendimentos)}
                label="Atendimentos"
                color={palette.primary}
              />
              <View
                style={{
                  width: 1,
                  backgroundColor: palette.border,
                  alignSelf: "stretch",
                }}
              />
              <PerfilStat
                value={`R$${fmt(stats.faturamento)}`}
                label="Faturado"
                color={palette.success}
                smaller
              />
              <View
                style={{
                  width: 1,
                  backgroundColor: palette.border,
                  alignSelf: "stretch",
                }}
              />
              <PerfilStat
                value={`${Math.round(stats.presenca)}%`}
                label="Presença"
              />
            </View>
            {stats.ticketMedio > 0 ? (
              <Text
                style={[
                  typography.caption,
                  {
                    color: palette.textMuted,
                    textAlign: "center",
                    marginTop: spacing.sm,
                  },
                ]}
              >
                ticket médio R${fmt(stats.ticketMedio)} · {stats.periodo}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ── SUA AGENDA ── */}
        <SettingsGroup label="Sua agenda">
          <SettingsRow
            title="Jornada de trabalho"
            onTap={() => go("/jornada")}
            testID="ir-jornada"
          />
          <SettingsRow
            title="Serviços e preços"
            onTap={() => go("/servicos")}
            testID="ir-servicos"
          />
          <SettingsRow
            title="Bloqueios recorrentes"
            onTap={() => go("/notificacoes")}
            testID="ir-notificacoes"
            last
          />
        </SettingsGroup>

        {/* ── NOTIFICAÇÕES ── */}
        <SettingsGroup label="Notificações">
          <SettingsRow title="WhatsApp" last />
        </SettingsGroup>

        {/* ── CONTA ── */}
        <SettingsGroup label="Conta">
          {user?.email ? (
            <SettingsRow title="E-mail" value={user.email} testID="ir-email" />
          ) : null}
          <SettingsRow
            title="Segurança"
            onTap={() => go("/2fa")}
            testID="ir-2fa"
          />
          <SettingsRow
            title="Sessões ativas"
            onTap={() => go("/sessoes")}
            testID="ir-sessoes"
          />
          <SettingsRow
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
                            borderColor: isAtiva
                              ? palette.primary
                              : palette.border,
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

        {/* ── Version ── */}
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
  urlPill: {},
  statsCard: {},
  statsRow: { flexDirection: "row", alignItems: "center" },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  logoutBtn: {},
});
