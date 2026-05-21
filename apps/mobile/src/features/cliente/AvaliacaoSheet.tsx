import { useState } from "react";
import {
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
}

const RATING_LABELS = [
  "",
  "Que pena 😔",
  "Pode melhorar",
  "Foi ok",
  "Muito bom!",
  "Perfeito! 💈",
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function AvaliacaoSheet({
  visible,
  onClose,
  agendamentoCodigo,
  barbeiroNome,
  servicoNome,
  onSuccess,
}: AvaliacaoSheetProps) {
  const { palette, spacing, typography, radius } = useTheme();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const avaliar = useAvaliarAgendamento();

  function handleClose() {
    setNota(0);
    setComentario("");
    onClose();
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

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      height={0.65}
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

        {/* Estrelas */}
        <View style={[styles.starsRow, { marginTop: spacing.lg }]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable
              key={i}
              testID={`star-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Nota ${i}`}
              onPress={() => setNota(i)}
              style={styles.starBtn}
            >
              <Text
                style={[
                  styles.starText,
                  { color: i <= nota ? palette.primary : palette.border },
                ]}
              >
                ★
              </Text>
            </Pressable>
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
            placeholder="Deixe um comentário opcional..."
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
    flex: 1,
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
    fontSize: 36,
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
