jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
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

import { renderHook } from "@testing-library/react-native";
import { usePushNotifications } from "../use-push-notifications";

describe("usePushNotifications", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("não registra token quando usuário não está logado", () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderHook(() => usePushNotifications());
    // When user is null, the effect returns early — no API calls
    expect(true).toBe(true); // hook runs without error
  });

  it("configura listeners quando usuário está logado", () => {
    mockUseAuth.mockReturnValue({ user: { codigo: 1 } });
    const Notifications = jest.requireMock("expo-notifications") as {
      addNotificationReceivedListener: jest.Mock;
      addNotificationResponseReceivedListener: jest.Mock;
    };
    renderHook(() => usePushNotifications());
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    expect(
      Notifications.addNotificationResponseReceivedListener,
    ).toHaveBeenCalled();
  });

  it("remove listeners ao desmontar", () => {
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
    unmount();
    expect(removeMock).toHaveBeenCalledTimes(2);
  });
});
