import { router } from "expo-router";
import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

import { api } from "@/src/shared/api/api-client";
import { useAuth } from "@/src/shared/hooks/use-auth";

type NotificationsModule = typeof Notifications;

let notificationsModule: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // expo-notifications 0.32+ substituiu `shouldShowAlert` por banner + list.
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationsModule = Notifications;
  } catch {
    notificationsModule = null;
  }

  return notificationsModule;
}

async function registerForPushNotificationsAsync(
  Notifications: NotificationsModule,
): Promise<string | null> {
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
  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    void (async () => {
      const Notifications = loadNotifications();
      if (!Notifications || !mounted) return;

      void registerForPushNotificationsAsync(Notifications)
        .then(async (token) => {
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
        })
        .catch(() => {
          // registerForPushNotificationsAsync pode rejeitar (ex.: serviço da Expo
          // fora do ar → 503 "no healthy upstream", permissão negada, sem
          // projectId). Push é best-effort: engolimos para não virar unhandled
          // rejection (que estoura o LogBox/red-box e degrada a UI no dev).
        });

      const notificationSubscription =
        Notifications.addNotificationReceivedListener((_notification) => {
          // Foreground notification received — no action needed, OS handles display
        });
      const responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as Record<
            string,
            unknown
          >;
          if (data?.barCodigo) {
            const dateParam = data.dataAgendamento
              ? `?data=${String(data.dataAgendamento).slice(0, 10)}`
              : "";
            router.push(`/(barbeiro)/agenda${dateParam}` as never);
          }
        });

      notificationListener.current = notificationSubscription;
      responseListener.current = responseSubscription;
    })();

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);
}
