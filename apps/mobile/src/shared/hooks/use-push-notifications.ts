import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import Constants from "expo-constants";

import { api } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    void registerForPushNotificationsAsync().then(async (token) => {
      if (!token || !mounted) return;
      try {
        const plataforma = Constants.platform?.ios
          ? "ios"
          : Constants.platform?.android
            ? "android"
            : "unknown";

        await api.post("/push-tokens", { token, plataforma });
      } catch {
        // Token registration is non-critical — don't crash app
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Foreground notification received — no action needed, OS handles display
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((_response) => {
        // User tapped notification — handle navigation if needed
      });

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);
}
