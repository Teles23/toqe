"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/shared/api/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider do TanStack Query.
 *
 * Importante: o `QueryClient` é criado dentro de `useState` para garantir
 * uma instância **por sessão de browser**, evitando reuso entre requests
 * SSR/RSC (que poderia vazar dados entre usuários). Doc:
 * https://tanstack.com/query/latest/docs/framework/react/guides/ssr#initial-setup
 */
export function QueryProvider({
  children,
}: QueryProviderProps): React.JSX.Element {
  const [client] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
