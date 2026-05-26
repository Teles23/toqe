import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * QR Scan Screen — visual mock (expo-camera não disponível).
 * Exibe o frame de scan com cantos amber e botão para digitar código manual.
 * Design: Urban Flow v2 / QRScanScreen spec.
 */
export default function QRScanScreen() {
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
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.topTitle}>Escanear QR</Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Frame area */}
      <View style={styles.frameArea}>
        {/* QR frame container */}
        <View testID="qr-frame" style={styles.frameContainer}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Camera unavailable placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraUnavailableText}>
              Câmera indisponível
            </Text>
          </View>
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          Aponte para o código QR da barbearia
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
          <Text style={styles.manualBtnText}>Digitar código manualmente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 36;
const CORNER_WIDTH = 3;
const CORNER_COLOR = "#F4B400";

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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
  },
  topTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 16,
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
    borderColor: CORNER_COLOR,
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
  // Camera placeholder
  cameraPlaceholder: {
    position: "absolute",
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    margin: CORNER_WIDTH,
  },
  cameraUnavailableText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    color: "#444444",
  },
  hintText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 13,
    color: "#aaaaaa",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 32,
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
    alignItems: "center",
    justifyContent: "center",
  },
  manualBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
});
