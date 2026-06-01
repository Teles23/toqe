import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAvaliarAgendamento } from "@/src/shared/hooks/cliente/use-avaliar-agendamento";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, BottomSheet } from "@/src/shared/ui";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AvaliacaoSheetProps {
  visible: boolean;
  onClose: () => void;
  agendamentoCodigo: number | null;
  barbeiroNome?: string;
  servicoNome?: string;
  onSuccess?: () => void;
  minutosAtras?: number;
}

const RATING_LABELS = [
  "",
  "Que pena 😔",
  "Pode melhorar",
  "Foi ok",
  "Muito bom!",
  "Perfeito! 💈",
];

const STAR_COLOR = "#F4B400";

// ─── Componente ───────────────────────────────────────────────────────────────

export function AvaliacaoSheet({
  visible,
  onClose,
  agendamentoCodigo,
  barbeiroNome,
  servicoNome,
  onSuccess,
  minutosAtras,
}: AvaliacaoSheetProps) {
  "use no memo";
  const { palette, spacing, typography, radius } = useTheme();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const avaliar = useAvaliarAgendamento();

  // Animated values — one per star, all start at scale 1.0
  const starScales = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1.0)),
  ).current;

  function handleClose() {
    setNota(0);
    setComentario("");
    onClose();
  }

  function handleStarPress(i: number) {
    setNota(i);

    // Stars 1..i spring to 1.15 (selected), stars i+1..5 spring back to 1.0
    const animations = starScales.map((val, idx) =>
      Animated.spring(val, {
        toValue: idx < i ? 1.15 : 1.0,
        useNativeDriver: true,
        bounciness: 12,
      }),
    );
    Animated.parallel(animations).start();
  }

  async function handleEnviar() {
    if (nota === 0 || agendamentoCodigo === null) return;
    try {
      await avaliar.mutateAsync({
        codigo: agendamentoCodigo,
        nota,
        comentario: comentario.trim() || undefined,
      });
      setNota(0);
      setComentario("");
      onSuccess?.();
      onClose();
    } catch {
      // erro tratado pelo caller via query state
    }
  }

  const commentPlaceholder =
    nota >= 4 ? "O que foi incrível? Nos conta!" : "O que podemos melhorar?";

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      height="content"
      testID="avaliacao-sheet"
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text
          style={[
            { fontFamily: "Sora_700Bold", fontSize: 20, lineHeight: 28 },
            { color: palette.text, textAlign: "center" },
          ]}
        >
          Como foi seu corte?
        </Text>

        {/* Subtítulo — barbeiro e serviço */}
        {barbeiroNome || servicoNome ? (
          <Text
            style={[
              typography.caption,
              {
                color: palette.textMuted,
                textAlign: "center",
                marginTop: spacing.xs,
              },
            ]}
          >
            {[barbeiroNome, servicoNome].filter(Boolean).join(" · ")}
          </Text>
        ) : null}

        {/* Subtítulo — há X minutos */}
        {minutosAtras !== undefined ? (
          <Text style={[typography.caption, styles.minutosAtras]}>
            Há {minutosAtras} minutos
          </Text>
        ) : null}

        {/* Estrelas */}
        <View style={[styles.starsRow, { marginTop: spacing.lg }]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Animated.View
              key={i}
              style={{ transform: [{ scale: starScales[i - 1] }] }}
            >
              <Pressable
                testID={`star-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`Nota ${i}`}
                onPress={() => handleStarPress(i)}
                style={styles.starBtn}
              >
                <Text
                  style={[
                    styles.starText,
                    {
                      color: STAR_COLOR,
                      opacity: i <= nota ? 1 : 0.35,
                    },
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Label da nota */}
        {nota > 0 ? (
          <Text
            style={[
              typography.label,
              {
                color: palette.primary,
                textAlign: "center",
                marginTop: spacing.sm,
              },
            ]}
          >
            {RATING_LABELS[nota]}
          </Text>
        ) : null}

        {/* Campo de comentário — aparece após selecionar nota */}
        {nota > 0 ? (
          <TextInput
            testID="input-comentario"
            value={comentario}
            onChangeText={setComentario}
            placeholder={commentPlaceholder}
            placeholderTextColor={palette.textMuted}
            multiline
            maxLength={280}
            style={[
              styles.commentInput,
              {
                color: palette.text,
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                borderRadius: radius.md,
                marginTop: spacing.md,
              },
            ]}
          />
        ) : null}

        {/* Botão enviar */}
        <View style={{ marginTop: spacing.lg }}>
          <AmberButton
            testID="btn-enviar-avaliacao"
            label="Enviar avaliação"
            disabled={nota === 0}
            loading={avaliar.isPending}
            onPress={handleEnviar}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flexGrow: 0,
    flexShrink: 1,
  },
  minutosAtras: {
    color: "#666666",
    textAlign: "center",
    marginTop: 2,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  starText: {
    fontSize: 32,
  },
  commentInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
});
