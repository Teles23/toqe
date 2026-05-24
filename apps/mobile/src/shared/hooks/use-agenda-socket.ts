import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import Constants from "expo-constants";
import { useAuth } from "./use-auth";

// Remove /api/v1 para obter a URL base do servidor
const API_URL = (
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3000/api/v1"
).replace(/\/api\/v1$/, "");

export function useAgendaSocket() {
  const { barbearia } = useAuth();
  const queryClient = useQueryClient();
  const barbeariaCodigo = barbearia?.codigo;

  useEffect(() => {
    if (!barbeariaCodigo) return;

    const socket = io(`${API_URL}/agenda`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      socket.emit("join-barbearia", barbeariaCodigo);
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["fila"] });
    };

    socket.on("agendamento:criado", invalidate);
    socket.on("agendamento:status", invalidate);

    return () => {
      socket.emit("leave-barbearia", barbeariaCodigo);
      socket.disconnect();
    };
  }, [barbeariaCodigo, queryClient]);
}
