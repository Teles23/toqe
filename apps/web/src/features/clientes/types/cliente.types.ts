import type { ClienteAPI } from "@toqe/contracts";

export type { ClienteAPI } from "@toqe/contracts";

export type ClienteStatus = "ativo" | "inativo" | "novo";

export interface Cliente extends ClienteAPI {
  initial: string;
  status: ClienteStatus;
}
