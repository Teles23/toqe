import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/src/shared/api/api-client";

interface AvatarResponse {
  avatarUrl: string;
}

async function pickAndUpload(): Promise<string> {
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

  if (result.canceled || !result.assets[0]) {
    throw new Error("CANCELLED");
  }

  const asset = result.assets[0];
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pickAndUpload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuario-me"] });
    },
  });
}
