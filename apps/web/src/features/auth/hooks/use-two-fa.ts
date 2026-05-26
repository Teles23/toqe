"use client";

import { useMutation } from "@tanstack/react-query";
import {
  request2FaSetup,
  request2FaEnable,
  request2FaDisable,
} from "@/features/auth/services/auth.service";

export function useTwoFaSetup() {
  return useMutation({
    mutationKey: ["auth", "2fa", "setup"],
    mutationFn: request2FaSetup,
  });
}

export function useTwoFaEnable() {
  return useMutation({
    mutationKey: ["auth", "2fa", "enable"],
    mutationFn: ({ code }: { code: string }) => request2FaEnable(code),
  });
}

export function useTwoFaDisable() {
  return useMutation({
    mutationKey: ["auth", "2fa", "disable"],
    mutationFn: ({ code }: { code: string }) => request2FaDisable(code),
  });
}
