/**
 * AdicionarClienteModal — cadastro manual de cliente pelo barbeiro, a partir do
 * botão "+" da tela Clientes.
 *
 * Diferente do `AdicionarWalkInModal` (que cria um ENCAIXE/agendamento na fila),
 * aqui apenas registramos o cliente na barbearia — sem agendamento. Campos:
 *  - Nome (obrigatório)
 *  - Telefone (obrigatório — principal forma de contato do barbeiro)
 *  - E-mail (opcional — o backend gera um sintético quando ausente)
 *
 * Mesmo shell visual do walk-in (bottom sheet animado + arrastar p/ fechar).
 */

import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/src/shared/api/api-client";
import { useCriarCliente } from "@/src/shared/hooks/barbeiro/use-criar-cliente";
import { useToast } from "@/src/shared/hooks/use-toast";
import { useTheme } from "@/src/shared/theme";
import { maskTelefone } from "@/src/shared/utils/masks";
import { AmberButton, FormErrorBox, FormInput } from "@/src/shared/ui";

const ACCENT = "#F4B400";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdicionarClienteModal({ visible, onClose, onSuccess }: Props) {
  "use no memo";
  const { palette, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const criarCliente = useCriarCliente();
  const { showToast } = useToast();

  const translateY = useSharedValue(screenHeight);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNome("");
    setTelefone("");
    setEmail("");
    setErro(null);
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    reset();
    onClose();
  }, [reset, onClose]);

  // Slide up/down ao abrir/fechar.
  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : screenHeight, {
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [visible, screenHeight, translateY]);

  // Back-button do Android fecha o sheet.
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

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 600) {
        translateY.value = withTiming(
          screenHeight,
          { duration: 180, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(handleClose)();
          },
        );
      } else {
        translateY.value = withTiming(0, {
          duration: 160,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const nomeOk = nome.trim().length >= 2;
  const telefoneOk = telefone.trim().length >= 8;
  const podeSalvar = nomeOk && telefoneOk && !criarCliente.isPending;

  const handleSubmit = async () => {
    if (!nomeOk) {
      setErro("Informe o nome do cliente (mín. 2 letras).");
      return;
    }
    if (!telefoneOk) {
      setErro("Informe um telefone válido.");
      return;
    }
    setErro(null);
    try {
      await criarCliente.mutateAsync({
        nome: nome.trim(),
        telefone: telefone.trim(),
        // E-mail opcional: só envia quando preenchido.
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      showToast("Cliente cadastrado", "success");
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErro("Esse cliente já está cadastrado nesta barbearia.");
      } else {
        const detalhe = err instanceof Error ? err.message : "tente novamente";
        setErro(`Não foi possível cadastrar o cliente · ${detalhe}`);
      }
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} testID="cliente-sheet">
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
          <GestureDetector gesture={dragGesture}>
            <View testID="sheet-handle" style={styles.dragHandleArea}>
              <View style={styles.dragHandle} />
            </View>
          </GestureDetector>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Feather name="user-plus" size={22} color={ACCENT} />
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Novo cliente</Text>
              <Text style={styles.headerSubtitle}>
                Cadastro rápido · sem agendamento
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
            }}
          >
            <FormErrorBox error={erro ?? undefined} />

            <FormInput
              label="Nome do cliente"
              placeholder="Nome completo"
              leftIcon="user"
              autoCapitalize="words"
              maxLength={100}
              value={nome}
              onChangeText={setNome}
              testID="cliente-nome"
            />

            <FormInput
              label="Telefone"
              placeholder="(11) 99999-9999"
              leftIcon="phone"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={20}
              value={telefone}
              onChangeText={(t) => setTelefone(maskTelefone(t))}
              testID="cliente-telefone"
            />

            <FormInput
              label="E-mail"
              hint="(opcional)"
              placeholder="email@exemplo.com"
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              maxLength={100}
              value={email}
              onChangeText={setEmail}
              testID="cliente-email"
            />
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
              label="Cadastrar cliente"
              icon="user-plus"
              onPress={handleSubmit}
              loading={criarCliente.isPending}
              disabled={!podeSalvar}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
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
  dragHandleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
  footer: {
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    backgroundColor: "#161616",
  },
});
