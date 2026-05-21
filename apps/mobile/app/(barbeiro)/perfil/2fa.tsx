import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  use2faDisable,
  use2faEnable,
  use2faSetup,
} from "@/src/shared/hooks/perfil/use-2fa";
import { useAuth } from "@/src/shared/hooks/use-auth";

const AMBER = "#F4B400";
const CARD = "#171717";
const BORDER = "#262626";
const BG = "#0d0d0d";
const FG = "#f5f5f5";
const FG3 = "#888888";
const FG4 = "#666666";
const GREEN = "#22c55e";

export default function Perfil2faScreen() {
  const { user } = useAuth();
  const [enabledLocal, setEnabledLocal] = useState<boolean | null>(null);
  const enabled =
    enabledLocal ?? (user as { twoFaEnabled?: boolean })?.twoFaEnabled ?? false;

  const setup = use2faSetup();
  const enable = use2faEnable();
  const disable = use2faDisable();

  // Step wizard: 0 = intro, 1 = QR, 2 = code
  const [step, setStep] = useState(0);
  const [showManualKey, setShowManualKey] = useState(false);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const codeRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Auto-focus first digit when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[index] = digit;
    setCodeDigits(next);
    if (digit && index < 5) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const fullCode = codeDigits.join("");

  const onSetup = async () => {
    setError(null);
    try {
      await setup.mutateAsync();
      setStep(1);
    } catch {
      setError("Não foi possível iniciar a configuração. Tente novamente.");
    }
  };

  const onEnable = async () => {
    setError(null);
    if (fullCode.length !== 6) {
      setError("Digite o código de 6 dígitos do seu app autenticador.");
      return;
    }
    setSubmitting(true);
    try {
      await enable.mutateAsync(fullCode);
      setEnabledLocal(true);
      setCodeDigits(["", "", "", "", "", ""]);
      Alert.alert(
        "2FA ativado",
        "Autenticação de 2 fatores ativada com sucesso.",
      );
      router.back();
    } catch {
      setError("Código inválido ou expirado.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDisable = () => {
    Alert.alert(
      "Desativar 2FA",
      "Tem certeza? Sua conta ficará menos protegida.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            setError(null);
            if (disableCode.length !== 6) {
              setError("Digite o código atual do seu app autenticador.");
              return;
            }
            try {
              await disable.mutateAsync(disableCode);
              setEnabledLocal(false);
              setDisableCode("");
            } catch {
              setError("Código inválido.");
            }
          },
        },
      ],
    );
  };

  // ─── Estado: 2FA já ativo — tela de desativação ───────────────────────────
  if (enabled) {
    return (
      <View style={[styles.container, { backgroundColor: BG }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Verificação em 2 passos</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View testID="2fa-enabled-section">
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ 2FA ativo</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.disableHint}>
              Para desativar, digite o código atual do seu app autenticador.
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CÓDIGO ATUAL (6 DÍGITOS)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="123456"
                placeholderTextColor={FG4}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                value={disableCode}
                onChangeText={(v) =>
                  setDisableCode(v.replace(/\D/g, "").slice(0, 6))
                }
              />
            </View>

            <Pressable
              style={styles.dangerBtn}
              onPress={onDisable}
              disabled={disable.isPending}
              accessibilityRole="button"
            >
              {disable.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.dangerBtnText}>Desativar 2FA</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Wizard de setup (3 passos) ───────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Verificação em 2 passos</Text>
          <Text style={styles.headerStep}>Passo {step + 1}/3</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ─── Passo 0: Intro ────────────────────────────────────────────── */}
        {step === 0 && (
          <View testID="step-0-intro">
            <View style={styles.heroContainer}>
              <View style={styles.heroCircle}>
                <Text style={styles.heroEmoji}>🛡</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Proteja sua conta</Text>
            <Text style={styles.heroSubtitle}>
              Adicione uma camada extra de segurança com um app autenticador.
            </Text>

            <View style={styles.benefitsContainer}>
              <BenefitRow
                emoji="🔑"
                text="Mesmo que alguém descubra sua senha, não entra sem o código"
              />
              <BenefitRow emoji="⏱" text="Código novo a cada 30s" />
              <BenefitRow
                emoji="📶"
                text="Funciona offline · Sem SMS necessário"
              />
            </View>
          </View>
        )}

        {/* ─── Passo 1: QR Code ──────────────────────────────────────────── */}
        {step === 1 && setup.data && (
          <View testID="step-1-qr">
            <Text style={styles.stepInstruction}>
              1. Abra seu app autenticador e{" "}
              <Text style={{ color: FG, fontFamily: "Inter_600SemiBold" }}>
                escaneie o QR abaixo
              </Text>
              :
            </Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrFrame}>
                <Image
                  source={{ uri: setup.data.qrCode }}
                  style={styles.qrImage}
                  accessibilityLabel="QR Code do 2FA"
                />
              </View>
            </View>

            <Text style={styles.stepInstruction}>
              2. Ou{" "}
              <Text
                style={styles.toggleManualLink}
                onPress={() => setShowManualKey((v) => !v)}
              >
                {showManualKey
                  ? "ocultar chave manual"
                  : "não consegue escanear? Digite manualmente:"}
              </Text>
            </Text>

            {showManualKey && (
              <View style={styles.manualKeyBox}>
                <Text style={styles.manualKey} selectable>
                  {setup.data.secret}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Passo 2: Código de 6 dígitos ──────────────────────────────── */}
        {step === 2 && (
          <View testID="step-2-code">
            <Text style={styles.stepInstruction}>
              Digite o{" "}
              <Text style={{ color: FG, fontFamily: "Inter_600SemiBold" }}>
                código de 6 dígitos
              </Text>{" "}
              que aparece no seu app autenticador:
            </Text>

            <View style={styles.codeRow}>
              {codeDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  testID={`code-input-${i}`}
                  ref={codeRefs[i]}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={({ nativeEvent }) =>
                    handleDigitKeyPress(nativeEvent.key, i)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.codeHintBox}>
              <Text style={styles.codeHintIcon}>⏱</Text>
              <Text style={styles.codeHintText}>
                O código muda a cada 30s. Se mudou enquanto você digitava, pegue
                o próximo.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.ctaWrapper}>
        {step === 0 && (
          <Pressable
            testID="btn-continuar"
            onPress={onSetup}
            style={[styles.ctaBtn, setup.isPending && styles.ctaBtnDisabled]}
            disabled={setup.isPending}
            accessibilityRole="button"
          >
            {setup.isPending ? (
              <ActivityIndicator color="#0d0d0d" />
            ) : (
              <Text style={styles.ctaBtnText}>Configurar agora</Text>
            )}
          </Pressable>
        )}

        {step === 1 && setup.data && (
          <Pressable
            testID="btn-continuar"
            onPress={() => setStep(2)}
            style={styles.ctaBtn}
            accessibilityRole="button"
          >
            <Text style={styles.ctaBtnText}>Já escaneei · próximo</Text>
          </Pressable>
        )}

        {step === 2 && (
          <Pressable
            testID="btn-ativar"
            onPress={onEnable}
            style={[
              styles.ctaBtn,
              (fullCode.length !== 6 || submitting) && styles.ctaBtnDisabled,
            ]}
            disabled={fullCode.length !== 6 || submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="#0d0d0d" />
            ) : (
              <Text style={styles.ctaBtnText}>Ativar 2FA</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BenefitRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>
        <Text style={styles.benefitEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
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
  headerStep: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: FG3,
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 120,
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
  // Step 0 — Intro
  heroContainer: {
    alignItems: "center",
    paddingVertical: 18,
  },
  heroCircle: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: "#F4B40020",
    borderWidth: 1,
    borderColor: "#F4B40038",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    color: FG,
    textAlign: "center",
    letterSpacing: -0.55,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: FG3,
    textAlign: "center",
    lineHeight: 20.15,
    marginTop: 8,
    marginBottom: 28,
  },
  benefitsContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#22c55e20",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitEmoji: {
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: FG,
    lineHeight: 19.5,
    fontFamily: "Inter_400Regular",
  },
  // Step 1 — QR
  stepInstruction: {
    fontSize: 13,
    color: "#aaaaaa",
    lineHeight: 20.15,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 14,
  },
  qrFrame: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  toggleManualLink: {
    color: AMBER,
    fontFamily: "Inter_500Medium",
  },
  manualKeyBox: {
    backgroundColor: "#F4B40014",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  manualKey: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: AMBER,
    letterSpacing: 2,
  },
  // Step 2 — Code
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  codeInput: {
    width: 42,
    height: 54,
    borderRadius: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 24,
    color: FG,
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: AMBER,
  },
  codeHintBox: {
    backgroundColor: "#22c55e10",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#22c55e30",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  codeHintIcon: {
    fontSize: 14,
    color: GREEN,
    marginTop: 1,
  },
  codeHintText: {
    flex: 1,
    fontSize: 11,
    color: "#9bd9b4",
    lineHeight: 16.5,
    fontFamily: "Inter_400Regular",
  },
  // Disable section
  activeBadge: {
    backgroundColor: "#22c55e14",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  activeBadgeText: {
    color: GREEN,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  disableHint: {
    fontSize: 14,
    color: "#aaaaaa",
    marginBottom: 16,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
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
  dangerBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  dangerBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: "#ffffff",
  },
  // CTA
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
    opacity: 0.4,
  },
  ctaBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    color: "#0d0d0d",
  },
});
