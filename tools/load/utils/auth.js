import http from "k6/http";
import { BASE_URL } from "../k6.config.js";

export function getToken(email, senha) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, senha }),
    { headers: { "Content-Type": "application/json" } },
  );
  return JSON.parse(res.body).access_token;
}
