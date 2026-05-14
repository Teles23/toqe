import http from 'k6/http';
import { check, sleep } from 'k6';
import { thresholds, BASE_URL } from '../k6.config.js';
import { getToken } from '../utils/auth.js';
import { tenantHeaders } from '../utils/tenant.js';

export const options = {
  thresholds,
  scenarios: {
    barbearia_soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
    },
  },
};

const barCodigo = __ENV.BAR_CODIGO || '1';

export function setup() {
  return { token: getToken('load@test.com', 'Senha@123') };
}

export default function (data) {
  const res = http.get(
    `${BASE_URL}/barbearia/${barCodigo}`,
    { headers: tenantHeaders(data.token, barCodigo) },
  );

  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(2);
}
