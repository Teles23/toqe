import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/shared/theme";

function extrairSlug(data: string): string | null {
  // toqe://barbearia/slug
  const deepLink = /toqe:\/\/barbearia\/([a-z0-9-]+)/i.exec(data);
  if (deepLink) return deepLink[1];

  // URL: …/barbearia/slug ou …/b/slug
  const url = /\/b(?:arbearia)?\/([a-z0-9-]+)/i.exec(data);
  if (url) return url[1];

  // QR contém apenas o slug (letras, números, hífens)
  if (/^[a-z0-9-]+$/i.test(data.trim())) return data.trim();

  return null;
}

export default function QRScanScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanLocked = useRef(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanLocked.current) return;
    scanLocked.current = true;
    setScanned(true);

    const slug = extrairSlug(data);
    if (slug) {
      router.replace(`/(cliente)/barbearia/${slug}` as never);
    } else {
      Alert.alert(
        "QR não reconhecido",
        "Este código não corresponde a uma barbearia do Toqe.",
        [
          {
            text: "Tentar novamente",
            onPress: () => {
              setScanned(false);
              scanLocked.current = false;
            },
          },
        ],
      );
    }
  };

  const handleDigitarManual = () => {
    Alert.prompt(
      "Código da barbearia",
      "Digite o slug da barbearia (ex: toqe-barber):",
      (texto) => {
        const slug = texto?.trim();
        if (slug) router.replace(`/(cliente)/barbearia/${slug}` as never);
      },
      "plain-text",
      "",
      "default",
    );
  };

  // Permissão ainda carregando
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permissão negada
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Feather name="camera-off" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={styles.permissionTitle}>Câmera bloqueada</Text>
        <Text style={styles.permissionDesc}>
          Permita o acesso à câmera nas configurações do dispositivo para
          escanear QR codes.
        </Text>
        <Pressable
          style={styles.permissionBtn}
          onPress={requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.permissionBtnText}>Permitir câmera</Text>
        </Pressable>
        <Pressable
          style={[styles.permissionBtn, styles.permissionBtnSecondary]}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.permissionBtnTextSecondary}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Câmera full-screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay escuro nas bordas */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View testID="qr-frame" style={styles.frameClear} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Cantos do frame */}
      <View style={styles.frameCorners} pointerEvents="none">
        <View
          style={[
            styles.corner,
            styles.cornerTL,
            { borderColor: palette.primary },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerTR,
            { borderColor: palette.primary },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBL,
            { borderColor: palette.primary },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBR,
            { borderColor: palette.primary },
          ]}
        />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Pressable
          testID="btn-voltar-qr"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.glassBtn}
        >
          <Feather name="x" size={18} color="#ffffff" />
        </Pressable>
        <Text style={styles.topTitle}>Escanear QR da barbearia</Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Hint */}
      <View style={styles.hintArea} pointerEvents="none">
        <Text style={styles.hintText}>
          Aponte a câmera para o QR Code da barbearia.
        </Text>
      </View>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 24 }]}>
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
const OVERLAY_COLOR = "rgba(0,0,0,0.65)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  // Overlay
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "column",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayMiddle: {
    height: FRAME_SIZE,
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  frameClear: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  // Frame corners
  frameCorners: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: "50%",
    left: "50%",
    marginTop: -(FRAME_SIZE / 2),
    marginLeft: -(FRAME_SIZE / 2),
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderRadius: 2,
  },
  cornerTR: {
    top: "50%",
    right: "50%",
    marginTop: -(FRAME_SIZE / 2),
    marginRight: -(FRAME_SIZE / 2),
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderRadius: 2,
  },
  cornerBL: {
    bottom: "50%",
    left: "50%",
    marginBottom: -(FRAME_SIZE / 2),
    marginLeft: -(FRAME_SIZE / 2),
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderRadius: 2,
  },
  cornerBR: {
    bottom: "50%",
    right: "50%",
    marginBottom: -(FRAME_SIZE / 2),
    marginRight: -(FRAME_SIZE / 2),
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderRadius: 2,
  },
  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
  // Hint
  hintArea: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  // Bottom
  bottomBar: {
    position: "absolute",
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
  // Permissão negada
  permissionTitle: {
    fontFamily: "Sora_700Bold",
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },
  permissionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  permissionBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  permissionBtnText: {
    fontFamily: "Sora_700Bold",
    fontSize: 14,
    color: "#0d0d0d",
  },
  permissionBtnTextSecondary: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#ffffff",
  },
});
