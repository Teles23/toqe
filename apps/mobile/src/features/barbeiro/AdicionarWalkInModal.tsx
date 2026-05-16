import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { useBarbeirosDaBarbearia } from "@/src/shared/hooks/barbeiro/use-barbeiros-da-barbearia";
import { useCriarWalkIn } from "@/src/shared/hooks/barbeiro/use-criar-walk-in";
import { useServicos } from "@/src/shared/hooks/barbeiro/use-servicos";
import { useTheme } from "@/src/shared/theme";
import { AmberButton, FormErrorBox, FormInput, Select } from "@/src/shared/ui";

const walkInFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  barbeiroId: z
    .number({ invalid_type_error: "Selecione um barbeiro" })
    .int()
    .positive("Selecione um barbeiro"),
  servicoId: z
    .number({ invalid_type_error: "Selecione um serviço" })
    .int()
    .positive("Selecione um serviço"),
});

type WalkInFormInput = z.infer<typeof walkInFormSchema>;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdicionarWalkInModal({ visible, onClose, onSuccess }: Props) {
  const { palette, spacing, typography } = useTheme();
  const { data: barbeiros = [] } = useBarbeirosDaBarbearia();
  const { data: servicos = [] } = useServicos();
  const criarWalkIn = useCriarWalkIn();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<WalkInFormInput>({
    resolver: zodResolver(walkInFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      barbeiroId: undefined as unknown as number,
      servicoId: undefined as unknown as number,
    },
  });

  const onSubmit = async (data: WalkInFormInput) => {
    try {
      await criarWalkIn.mutateAsync({
        cliente: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || undefined,
        },
        barbeiroId: data.barbeiroId,
        servicosIds: [data.servicoId],
      });
      reset();
      onSuccess?.();
      onClose();
    } catch {
      setError("root", {
        message: "Não foi possível adicionar à fila. Tente novamente.",
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={handleClose}
          accessibilityLabel="Fechar"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.bg,
              borderColor: palette.border,
              paddingTop: spacing.md,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ ...typography.heading, color: palette.text }}>
              Adicionar à fila
            </Text>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              hitSlop={12}
            >
              <Text
                style={{
                  ...typography.body,
                  color: palette.primary,
                  fontWeight: "600",
                }}
              >
                Cancelar
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          >
            <FormErrorBox error={errors.root?.message} />

            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Nome do cliente"
                  placeholder="João Silva"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.nome?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="E-mail"
                  placeholder="joao@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
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
                  placeholder="+55 11 99999-9999"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value ?? ""}
                />
              )}
            />

            <Controller
              control={control}
              name="barbeiroId"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Atender com"
                  value={value ?? null}
                  onChange={onChange}
                  options={barbeiros.map((b) => ({
                    value: b.usrCodigo,
                    label: b.nome,
                  }))}
                  placeholder="Selecione o barbeiro"
                  error={errors.barbeiroId?.message}
                  testID="select-barbeiro"
                />
              )}
            />

            <Controller
              control={control}
              name="servicoId"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Serviço"
                  value={value ?? null}
                  onChange={onChange}
                  options={servicos.map((s) => ({
                    value: s.codigo,
                    label: s.nome,
                    hint: `${s.duracaoBase}min · R$ ${Number(s.precoBase).toFixed(2)}`,
                  }))}
                  placeholder="Selecione o serviço"
                  error={errors.servicoId?.message}
                  testID="select-servico"
                />
              )}
            />

            <View style={{ marginTop: spacing.sm }}>
              <AmberButton
                label="Adicionar à fila"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: "92%",
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
