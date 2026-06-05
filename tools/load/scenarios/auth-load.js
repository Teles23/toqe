import http from "k6/http";
import { check, sleep } from "k6";
import { thresholds, BASE_URL } from "../k6.config.js";

export const options = {
  thresholds,
  scenarios: {
    auth_load: {
      executor: "constant-vus",
      vus: 100,
      duration: "2m",
    },
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: "load@test.com", senha: "Senha@123" }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, {
    "status 200 ou 201": (r) => r.status === 200 || r.status === 201,
    "tem access_token": (r) => {
      try {
        return JSON.parse(r.body).access_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
