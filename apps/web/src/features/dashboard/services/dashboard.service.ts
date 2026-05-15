import { barbeariaApi } from "@/shared/api/api-client";
import type { DashboardOverview } from "../types/dashboard.types";

export async function fetchDashboardOverview(
  barCodigo: number,
): Promise<DashboardOverview> {
  return barbeariaApi(barCodigo).get<DashboardOverview>("/dashboard");
}
