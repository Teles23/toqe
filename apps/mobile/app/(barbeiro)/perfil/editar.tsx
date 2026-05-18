import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { useEditarPerfil } from "@/src/shared/hooks/perfil/use-editar-perfil";
import { maskTelefone } from "@/src/shared/utils/masks";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useTheme } from "@/src/shared/theme";
import { Button, FormErrorBox, FormInput, ScreenHeader } from "@/src/shared/ui";
import { updateUsuarioSchema, type UpdateUsuarioInput } from "@toqe/contracts";

export default function PerfilEditarScreen() {
  const { palette, spacing } = useTheme();
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

  const onSubmit = async (data: UpdateUsuarioInput) => {
    try {
      // Backend não aceita string vazia em telefone com a regex — converte para undefined
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
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScreenHeader
        title="Editar perfil"
        right={
          <Button
            label="Voltar"
            variant="secondary"
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
      >
        <FormErrorBox error={errors.root?.message} />

        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Nome"
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoComplete="name"
              maxLength={100}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ""}
              error={errors.nome?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="telefone"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Telefone"
              hint="(opcional)"
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={20}
              onBlur={onBlur}
              onChangeText={(text) => onChange(maskTelefone(text))}
              value={value ?? ""}
              error={errors.telefone?.message}
            />
          )}
        />

        <View style={{ marginTop: spacing.md }}>
          <Button
            label="Salvar"
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
