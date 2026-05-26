"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { QUERY_KEYS } from "@/shared/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function useAgendaSocket(
  barCodigo: number | null | undefined,
  dateStr: string,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!barCodigo) return;

    const socket = io(`${API_URL}/agenda`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      socket.emit("join-barbearia", barCodigo);
    });

    const invalidate = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.agendamentos(barCodigo, dateStr),
      });
    };

    socket.on("agendamento:criado", invalidate);
    socket.on("agendamento:status", invalidate);

    return () => {
      socket.emit("leave-barbearia", barCodigo);
      socket.disconnect();
    };
  }, [barCodigo, dateStr, queryClient]);
}
