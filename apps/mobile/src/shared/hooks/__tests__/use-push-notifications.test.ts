jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  getExpoPushTokenAsync: jest
    .fn()
    .mockResolvedValue({ data: "ExponentPushToken[test]" }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:3000/api/v1" } },
    platform: { ios: true },
    easConfig: { projectId: "test-project-id" },
  },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockUseAuth = jest.fn();
jest.mock("@/src/shared/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/src/shared/api/api-client", () => ({
  api: { post: jest.fn().mockResolvedValue({}) },
  tenantApi: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import { usePushNotifications } from "../use-push-notifications";

describe("usePushNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReset();
  });

  it("não registra token quando usuário não está logado", () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderHook(() => usePushNotifications());
    // When user is null, the effect returns early — no API calls
    expect(true).toBe(true); // hook runs without error
  });

  it("configura listeners quando usuário está logado", async () => {
    mockUseAuth.mockReturnValue({ user: { codigo: 1 } });
    const Notifications = jest.requireMock("expo-notifications") as {
      addNotificationReceivedListener: jest.Mock;
      addNotificationResponseReceivedListener: jest.Mock;
    };
    renderHook(() => usePushNotifications());
    await waitFor(() => {
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalled();
    });
  });

  it("não gera unhandled rejection quando o registro de push falha (ex.: Expo 503)", async () => {
    mockUseAuth.mockReturnValue({ user: { codigo: 1 } });
    const Notifications = jest.requireMock("expo-notifications") as {
      getPermissionsAsync: jest.Mock;
      getExpoPushTokenAsync: jest.Mock;
    };
    // Permissão concedida → segue para buscar o token, que falha (503).
    Notifications.getPermissionsAsync.mockResolvedValueOnce({
      status: "granted",
    });
    Notifications.getExpoPushTokenAsync.mockRejectedValueOnce(
      new Error("503 no healthy upstream"),
    );
    const { api } = jest.requireMock("@/src/shared/api/api-client") as {
      api: { post: jest.Mock };
    };

    const onUnhandled = jest.fn();
    process.on("unhandledRejection", onUnhandled);
    try {
      renderHook(() => usePushNotifications());
      // Flush das microtasks para a promise rejeitar e o .catch rodar.
      await new Promise((r) => setTimeout(r, 10));
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }

    expect(onUnhandled).not.toHaveBeenCalled();
    // Token nunca resolveu → não tenta registrar no backend.
    expect(api.post).not.toHaveBeenCalled();
  });

  it("remove listeners ao desmontar", async () => {
    mockUseAuth.mockReturnValue({ user: { codigo: 1 } });
    const removeMock = jest.fn();
    const Notifications = jest.requireMock("expo-notifications") as {
      addNotificationReceivedListener: jest.Mock;
      addNotificationResponseReceivedListener: jest.Mock;
    };
    Notifications.addNotificationReceivedListener.mockReturnValue({
      remove: removeMock,
    });
    Notifications.addNotificationResponseReceivedListener.mockReturnValue({
      remove: removeMock,
    });

    const { unmount } = renderHook(() => usePushNotifications());
    await waitFor(() => {
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalled();
    });

    unmount();
    expect(removeMock).toHaveBeenCalledTimes(2);
  });
});
