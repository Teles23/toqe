import http from "k6/http";
import { check, sleep } from "k6";
import { thresholds, BASE_URL } from "../k6.config.js";
import { getToken } from "../utils/auth.js";
import { tenantHeaders } from "../utils/tenant.js";

export const options = {
  thresholds,
  scenarios: {
    agendamento_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 0 },
      ],
    },
  },
};

let token;
const barCodigo = __ENV.BAR_CODIGO || "1";

export function setup() {
  token = getToken("load@test.com", "Senha@123");
  return { token };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/agendamentos`, {
    headers: tenantHeaders(data.token, barCodigo),
  });

  check(res, { "status 200": (r) => r.status === 200 });
  sleep(0.5);
}
