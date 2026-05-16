import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";

import { ApiError } from "@/src/shared/api/api-client";
import { useMudarSenha } from "@/src/shared/hooks/perfil/use-mudar-senha";
import { useTheme } from "@/src/shared/theme";
import {
  AmberButton,
  FormErrorBox,
  FormInput,
  GhostButton,
  ScreenHeader,
} from "@/src/shared/ui";

// Schema local: estende o do backend com confirmação
const senhaFormSchema = z
  .object({
    senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
    novaSenha: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
    confirmar: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    message: "Nova senha deve ser diferente da atual",
    path: ["novaSenha"],
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  });

type SenhaFormInput = z.infer<typeof senhaFormSchema>;

export default function PerfilSenhaScreen() {
  const { palette, spacing } = useTheme();
  const mudar = useMudarSenha();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SenhaFormInput>({
    resolver: zodResolver(senhaFormSchema),
    defaultValues: { senhaAtual: "", novaSenha: "", confirmar: "" },
  });

  const onSubmit = async (data: SenhaFormInput) => {
    try {
      await mudar.mutateAsync({
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
      Alert.alert(
        "Senha alterada",
        "Sua senha foi alterada. Outras sessões foram encerradas por segurança.",
      );
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("senhaAtual", { message: "Senha atual incorreta." });
      } else {
        setError("root", {
          message: "Não foi possível alterar a senha. Tente novamente.",
        });
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Mudar senha"
        right={
          <GhostButton
            label="Voltar"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
          />
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <FormErrorBox error={errors.root?.message} />

        <Controller
          control={control}
          name="senhaAtual"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Senha atual"
              placeholder="••••••"
              secureTextEntry
              autoComplete="password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.senhaAtual?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="novaSenha"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Nova senha"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.novaSenha?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmar"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Confirmar nova senha"
              placeholder="Repita a senha"
              secureTextEntry
              autoComplete="new-password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmar?.message}
            />
          )}
        />

        <View style={{ marginTop: spacing.md }}>
          <AmberButton
            label="Alterar senha"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
