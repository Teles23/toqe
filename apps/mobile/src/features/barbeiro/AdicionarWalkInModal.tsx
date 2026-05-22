/**
 * AdicionarWalkInModal — "Encaixe agora" (walk-in) no estilo do protótipo
 * `barbeiro-sheets.jsx::WalkinSheet`.
 *
 * Sheet leve: nome (opcional) + chips de serviço (reais via `useServicos`)
 * + chips de duração + info verde + "Atender agora". Sem selects de barbeiro
 * nem e-mail (o protótipo não os coleta):
 *  - `barbeiroId` = barbeiro logado (`useAuth().user.codigo`)
 *  - `email` sintético determinístico para satisfazer o contrato atual
 *    (`criarClienteRapidoSchema` exige email). TODO: tornar e-mail opcional
 *    no backend numa fase futura.
 *  - duração é exibida (reflete a do serviço); o backend deriva a real do serviço.
 */

import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { useCriarWalkIn } from "@/src/shared/hooks/barbeiro/use-criar-walk-in";
import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";
import { useToast } from "@/src/shared/hooks/use-toast";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, FormErrorBox, FormInput } from "@/src/shared/ui";

const ACCENT = "#F4B400";
const DURATIONS = [15, 30, 45, 60];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdicionarWalkInModal({ visible, onClose, onSuccess }: Props) {
  const { palette, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { user } = useAuth();
  const { data: servicos = [] } = useServicos();
  const criarWalkIn = useCriarWalkIn();
  const { showToast } = useToast();

  const translateY = useSharedValue(screenHeight);

  const ativos = useMemo(() => servicos.filter((s) => s.ativo), [servicos]);

  const [nome, setNome] = useState("");
  const [servicoId, setServicoId] = useState<number | null>(null);
  const [duration, setDuration] = useState(30);
  const [erro, setErro] = useState<string | null>(null);

  // Default: primeiro serviço ativo + sua duração
  useEffect(() => {
    if (servicoId === null && ativos.length > 0) {
      setServicoId(ativos[0].codigo);
      setDuration(ativos[0].duracaoBase);
    }
  }, [ativos, servicoId]);

  const reset = useCallback(() => {
    setNome("");
    setServicoId(ativos[0]?.codigo ?? null);
    setDuration(ativos[0]?.duracaoBase ?? 30);
    setErro(null);
  }, [ativos]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    reset();
    onClose();
  }, [reset, onClose]);

  // Slide up/down ao abrir/fechar (substitui o animationType do Modal removido).
  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : screenHeight, {
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [visible, screenHeight, translateY]);

  // Back-button do Android fecha o sheet (substitui onRequestClose do Modal).
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelectServico = (codigo: number, duracaoBase: number) => {
    setServicoId(codigo);
    setDuration(duracaoBase);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    if (servicoId === null) {
      setErro("Selecione um serviço.");
      return;
    }
    setErro(null);
    try {
      await criarWalkIn.mutateAsync({
        cliente: {
          nome: nome.trim(),
          // E-mail sintético — contrato exige email; encaixe não o coleta.
          email: `walkin-${Date.now()}@walk-in.local`,
        },
        barbeiroId: user!.codigo,
        servicosIds: [servicoId],
      });
      showToast("Encaixe adicionado à fila", "success");
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      const detalhe = err instanceof Error ? err.message : "tente novamente";
      setErro(`Não foi possível adicionar o encaixe · ${detalhe}`);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} testID="walkin-sheet">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={handleClose}
          accessibilityLabel="Fechar"
        />
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Feather name="user" size={22} color={ACCENT} />
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Encaixe agora</Text>
              <Text style={styles.headerSubtitle}>
                Encaixe · sem agendamento prévio
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={styles.closeBtn}
            >
              <Feather name="x" size={16} color="#888888" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xl,
              gap: 16,
            }}
          >
            <FormErrorBox error={erro ?? undefined} />

            {/* Nome */}
            <FormInput
              label="Nome do cliente"
              placeholder="Quem é?"
              leftIcon="user"
              autoCapitalize="words"
              maxLength={100}
              value={nome}
              onChangeText={setNome}
            />

            {/* Serviço — chips */}
            <View>
              <Text style={styles.fieldLabel}>SERVIÇO</Text>
              {ativos.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Nenhum serviço ativo. Ative serviços em Perfil › Serviços.
                </Text>
              ) : null}
              <View style={styles.grid2}>
                {ativos.map((s) => {
                  const active = s.codigo === servicoId;
                  return (
                    <Pressable
                      key={s.codigo}
                      testID={`walkin-servico-${s.codigo}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={s.nome}
                      onPress={() =>
                        handleSelectServico(s.codigo, s.duracaoBase)
                      }
                      style={[
                        styles.chip,
                        active ? styles.chipActive : styles.chipIdle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? ACCENT : "#aaaaaa" },
                        ]}
                        numberOfLines={1}
                      >
                        {s.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Duração — chips (display; backend deriva do serviço) */}
            <View>
              <Text style={styles.fieldLabel}>DURAÇÃO</Text>
              <View style={styles.grid4}>
                {DURATIONS.map((d) => {
                  const active = d === duration;
                  return (
                    <Pressable
                      key={d}
                      testID={`walkin-duracao-${d}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${d} minutos`}
                      onPress={() => setDuration(d)}
                      style={[
                        styles.chipDur,
                        active ? styles.chipActive : styles.chipIdle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipDurText,
                          { color: active ? ACCENT : "#aaaaaa" },
                        ]}
                      >
                        {d}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Info verde */}
            <View style={styles.infoBox}>
              <Feather name="check-circle" size={14} color="#22c55e" />
              <Text style={styles.infoBoxText}>
                Será inserido como WALK_IN · ocupa o próximo slot livre
              </Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <View
            style={[
              styles.footer,
              {
                paddingHorizontal: spacing.lg,
                paddingBottom: insets.bottom + 18,
                borderTopColor: palette.border,
              },
            ]}
          >
            <AmberButton
              label="Atender agora"
              icon="play"
              iconRight="arrow-right"
              onPress={handleSubmit}
              loading={criarWalkIn.isPending}
              disabled={!nome.trim() || criarWalkIn.isPending}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlay in-screen (não Modal): cobre só a área de conteúdo, deixando a
  // tab bar do Expo Router visível abaixo. zIndex/elevation acima do FAB (10).
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: "92%",
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  scroll: {
    flexShrink: 1,
  },
  emptyHint: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a3a3a",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ACCENT + "1a",
    borderWidth: 1,
    borderColor: ACCENT + "38",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitles: { flex: 1 },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    color: "#f5f5f5",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#888888",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 10,
    color: "#666666",
    letterSpacing: 1.4,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  grid4: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    flexBasis: "48%",
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  chipDur: {
    flex: 1,
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chipIdle: {
    backgroundColor: "#1c1c1c",
    borderColor: "#262626",
  },
  chipActive: {
    backgroundColor: ACCENT + "1c",
    borderColor: ACCENT,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  chipDurText: {
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 13,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: "#9bd9b4",
    fontFamily: "Inter_400Regular",
  },
  footer: {
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    backgroundColor: "#161616",
  },
});
