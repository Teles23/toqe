import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { io } from "socket.io-client";
import { useAgendaSocket } from "../use-agenda-socket";

// Mock socket.io-client
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();
const mockSocket = {
  on: mockOn,
  emit: mockEmit,
  disconnect: mockDisconnect,
};
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("useAgendaSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não conecta quando barCodigo é null", () => {
    renderHook(() => useAgendaSocket(null, "2026-05-24"), { wrapper });
    expect(io).not.toHaveBeenCalled();
  });

  it("conecta e entra na sala quando barCodigo definido", () => {
    renderHook(() => useAgendaSocket(1, "2026-05-24"), { wrapper });
    expect(io).toHaveBeenCalledWith(
      expect.stringContaining("/agenda"),
      expect.any(Object),
    );
    // simula connect
    const connectHandler = mockOn.mock.calls.find(
      ([ev]) => ev === "connect",
    )?.[1];
    connectHandler?.();
    expect(mockEmit).toHaveBeenCalledWith("join-barbearia", 1);
  });

  it("desconecta na desmontagem", () => {
    const { unmount } = renderHook(() => useAgendaSocket(1, "2026-05-24"), {
      wrapper,
    });
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
