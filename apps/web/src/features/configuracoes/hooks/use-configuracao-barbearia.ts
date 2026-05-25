"use client";

/**
 * use-configuracao-barbearia.ts
 *
 * Hook que busca os dados de plano/status de uma barbearia.
 * Re-exporta useConfiguracaoPlano para manter uma interface coerente
 * com os demais hooks da feature de configurações.
 */

export { useConfiguracaoPlano as useConfiguracaoBarbeariaPlano } from "./use-configuracao-plano";
export type { PlanoConfig } from "./use-configuracao-plano";
