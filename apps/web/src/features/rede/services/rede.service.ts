import { api } from "@/shared/api/api-client";
import type { RedeOverview } from "../types/rede.types";

export async function fetchRedeOverview(): Promise<RedeOverview> {
  return api.get<RedeOverview>("/barbearias/rede");
}
