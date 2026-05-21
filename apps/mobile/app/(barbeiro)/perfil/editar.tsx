import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEditarPerfil } from "@/src/shared/hooks/perfil/use-editar-perfil";
import { maskTelefone } from "@/src/shared/utils/masks";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { updateUsuarioSchema, type UpdateUsuarioInput } from "@toqe/contracts";

const AMBER = "#F4B400";
const CARD = "#171717";
const BORDER = "#262626";
const BG = "#0d0d0d";
const FG = "#f5f5f5";
const FG4 = "#666666";
const FG3 = "#888888";

export default function PerfilEditarScreen() {
  const { user } = useAuth();
  const editar = useEditarPerfil();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdateUsuarioInput>({
    resolver: zodResolver(updateUsuarioSchema),
    defaultValues: {
      nome: user?.nome ?? "",
      telefone: user?.telefone ?? "",
    },
  });

  const initial = (user?.nome ?? "?").trim()[0]?.toUpperCase() ?? "?";
  const email = (user as { email?: string })?.email ?? "";

  const onSubmit = async (data: UpdateUsuarioInput) => {
    try {
      const payload: UpdateUsuarioInput = {
        nome: data.nome,
        telefone:
          data.telefone && data.telefone.trim() ? data.telefone : undefined,
      };
      await editar.mutateAsync(payload);
      Alert.alert("Tudo certo", "Dados atualizados com sucesso.");
      router.back();
    } catch {
      setError("root", {
        message: "Não foi possível salvar. Tente novamente.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: BG }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Editar perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
            <Pressable
              style={styles.avatarEditBtn}
              onPress={() => Alert.alert("Em breve", "Upload de foto em breve")}
              accessibilityRole="button"
              accessibilityLabel="Editar foto"
            >
              <Text style={styles.avatarEditIcon}>✏</Text>
            </Pressable>
          </View>
        </View>

        {/* Erro global */}
        {errors.root?.message ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.root.message}</Text>
          </View>
        ) : null}

        {/* Campo Nome */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="input-nome"
                style={[
                  styles.fieldInput,
                  errors.nome ? { color: "#ef4444" } : null,
                ]}
                placeholder="Seu nome completo"
                placeholderTextColor={FG4}
                autoCapitalize="words"
                autoComplete="name"
                maxLength={100}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
              />
            )}
          />
          {errors.nome?.message ? (
            <Text style={styles.fieldError}>{errors.nome.message}</Text>
          ) : null}
        </View>

        {/* Campo Telefone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>TELEFONE</Text>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="input-telefone"
                style={styles.fieldInput}
                placeholder="(11) 99999-9999"
                placeholderTextColor={FG4}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={20}
                onBlur={onBlur}
                onChangeText={(text) => onChange(maskTelefone(text))}
                value={value ?? ""}
              />
            )}
          />
          {errors.telefone?.message ? (
            <Text style={styles.fieldError}>{errors.telefone.message}</Text>
          ) : null}
        </View>

        {/* E-mail (read-only) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>E-MAIL</Text>
          <View style={styles.emailRow}>
            <Text style={styles.emailValue} numberOfLines={1}>
              {email}
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>VERIFICADO</Text>
            </View>
          </View>
          <Text style={styles.emailHint}>
            E-mail não pode ser editado. Para trocar, contate o suporte.
          </Text>
        </View>
      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.ctaWrapper}>
        <Pressable
          testID="btn-salvar"
          onPress={handleSubmit(onSubmit)}
          style={[styles.ctaBtn, isSubmitting && styles.ctaBtnDisabled]}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Salvar mudanças"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.ctaBtnText}>Salvar mudanças</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: FG,
  },
  headerTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    color: FG,
    letterSpacing: -0.45,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 28,
  },
  avatarWrapper: {
    position: "relative",
    width: 80,
    height: 80,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 32,
    color: "#0d0d0d",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditIcon: {
    fontSize: 12,
    color: "#0d0d0d",
  },
  errorBox: {
    backgroundColor: "#ef444420",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
  },
  fieldContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: FG4,
    marginBottom: 6,
    fontFamily: "Inter_600SemiBold",
  },
  fieldInput: {
    fontSize: 15,
    color: FG,
    height: 30,
    fontFamily: "Inter_400Regular",
  },
  fieldError: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
  },
  emailValue: {
    flex: 1,
    fontSize: 14,
    color: FG3,
    fontFamily: "Inter_400Regular",
  },
  verifiedBadge: {
    backgroundColor: "#22c55e1a",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    color: "#22c55e",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  emailHint: {
    fontSize: 11,
    color: FG4,
    marginTop: 6,
    lineHeight: 15.4,
    fontFamily: "Inter_400Regular",
  },
  ctaWrapper: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: "#0d0d0d",
  },
});
