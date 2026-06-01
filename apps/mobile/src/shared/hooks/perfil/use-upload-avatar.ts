import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

interface AvatarResponse {
  avatarUrl: string;
}

async function pickAsset(
  source: "camera" | "gallery",
): Promise<ImagePicker.ImagePickerAsset | null> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão para acessar a câmera é necessária.");
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    return result.canceled ? null : (result.assets[0] ?? null);
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão para acessar a galeria é necessária.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    return result.canceled ? null : (result.assets[0] ?? null);
  }
}

function promptSource(): Promise<"camera" | "gallery" | "cancel"> {
  return new Promise((resolve) => {
    Alert.alert(
      "Foto de perfil",
      "Escolha a origem da foto",
      [
        { text: "Câmera", onPress: () => resolve("camera") },
        { text: "Galeria", onPress: () => resolve("gallery") },
        { text: "Cancelar", style: "cancel", onPress: () => resolve("cancel") },
      ],
      { cancelable: true, onDismiss: () => resolve("cancel") },
    );
  });
}

async function pickAndUpload(): Promise<string> {
  const source = await promptSource();
  if (source === "cancel") throw new Error("CANCELLED");

  const asset = await pickAsset(source);
  if (!asset) throw new Error("CANCELLED");

  const filename = asset.uri.split("/").pop() ?? "avatar.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  const formData = new FormData();
  formData.append("file", { uri: asset.uri, name: filename, type } as never);

  const { avatarUrl } = await api.postFormData<AvatarResponse>(
    "/usuarios/me/avatar",
    formData,
  );
  return avatarUrl;
}

export function useUploadAvatar() {
  const { reloadUser } = useAuth();
  return useMutation({
    mutationFn: pickAndUpload,
    onSuccess: async () => {
      await reloadUser();
    },
  });
}
