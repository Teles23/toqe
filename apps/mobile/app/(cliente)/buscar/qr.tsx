import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/shared/theme";

/**
 * QR Scan Screen — visual mock (expo-camera não disponível).
 * Exibe o frame de scan com cantos amber e botão para digitar código manual.
 * Design: Urban Flow v2 / QRScanScreen spec.
 */
export default function QRScanScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleDigitarManual = () => {
    Alert.prompt(
      "Código da barbearia",
      "Digite o código de convite recebido:",
      (codigo) => {
        if (codigo && codigo.trim()) {
          // TODO: resolver convite pelo código manualmente
          router.back();
        }
      },
      "plain-text",
      "",
      "default",
    );
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Pressable
          testID="btn-voltar-qr"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={handleBack}
          style={styles.glassBtn}
        >
          <Feather name="x" size={18} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Escanear QR da barbearia</Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Frame area */}
      <View style={styles.frameArea}>
        {/* QR frame container */}
        <View testID="qr-frame" style={styles.frameContainer}>
          {/* Corners */}
          <View
            style={[
              styles.corner,
              styles.cornerTopLeft,
              { borderColor: palette.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerTopRight,
              { borderColor: palette.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBottomLeft,
              { borderColor: palette.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBottomRight,
              { borderColor: palette.primary },
            ]}
          />

          {/* Scan line */}
          <View
            style={[styles.scanLine, { backgroundColor: palette.primary }]}
          />

          {/* Camera unavailable placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraUnavailableText}>
              posicione o QR aqui
            </Text>
          </View>
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          Aponte a câmera para o QR Code que está na recepção da barbearia.
        </Text>
      </View>

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <Pressable
          testID="btn-digitar-manual"
          accessibilityRole="button"
          accessibilityLabel="Digitar código manualmente"
          onPress={handleDigitarManual}
          style={styles.manualBtn}
        >
          <Feather name="edit-2" size={14} color="#ffffff" />
          <Text style={styles.manualBtnText}>Digitar código manualmente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 36;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  // ── Top bar
  topBar: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    color: "#ffffff",
  },
  topSpacer: {
    width: 40,
  },
  // ── Frame area
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frameContainer: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
  },
  // Corner pieces
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderRadius: 2,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 8,
    right: 8,
    height: 2,
  },
  // Camera placeholder
  cameraPlaceholder: {
    position: "absolute",
    top: CORNER_WIDTH,
    left: CORNER_WIDTH,
    right: CORNER_WIDTH,
    bottom: CORNER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraUnavailableText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#ffffff",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  // ── Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
  },
  manualBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  manualBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#ffffff",
  },
});
