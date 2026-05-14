# Load Testing (k6)

k6 deve estar instalado globalmente: https://k6.io/docs/get-started/installation/

## Rodar cenários

```bash
# Auth — 100 VUs por 2 minutos
k6 run tools/load/scenarios/auth-load.js

# Agendamentos — spike test
k6 run tools/load/scenarios/agendamento-load.js

# Barbearia — soak test 10 minutos
k6 run tools/load/scenarios/barbearia-load.js

# Apontar para outro host
BASE_URL=https://staging.toqe.com k6 run tools/load/scenarios/auth-load.js
```

## Thresholds

- `p(95) < 500ms` para duração de requisições
- `rate < 1%` para requisições com falha
