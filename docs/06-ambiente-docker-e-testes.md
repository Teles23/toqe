# Ambiente de Execução e Testes (Docker)

Este documento descreve como subir e testar o ecossistema completo do Toqe usando Docker Compose.

---

## Infraestrutura

O projeto utiliza **Docker Compose** para orquestrar os serviços. A comunicação externa é centralizada no **NGINX**, que atua como proxy reverso.

### Portas Mapeadas (Host)

| Serviço | Porta Interna | Porta Externa (Host) | Notas |
|---|---|---|---|
| **NGINX** | 80 | **8080** | Ponto central de acesso |
| **Postgres** | 5432 | **5432** | Acesso direto ao banco se necessário |
| **Redis** | 6379 | *Nenhuma* | Apenas rede interna do Docker |

> [!IMPORTANT]
> A porta externa do NGINX foi alterada para **8080** para evitar conflitos com o IIS ou outros serviços do sistema que costumam ocupar a porta 80 no Windows.

---

## Como Rodar

Para subir o ambiente completo (API, NGINX, Postgres, Redis):

```bash
docker compose up -d --build
```

> [!NOTE]
> O container `web` está temporariamente desativado no `docker-compose.yml` até a implementação da Fase 5 (Frontend).

---

## Como Testar

### 1. Swagger UI (Documentação Interativa)

Acesse a documentação interativa diretamente pelo navegador:
👉 **[http://localhost:8080/docs](http://localhost:8080/docs)**

### 2. Postman

Uma collection completa está disponível em: `docs/toqe-postman-collection.json`.

- **Base URL**: `http://localhost:8080/api/v1`
- **Fluxo Sugerido**:
    1. Importe a collection no Postman.
    2. Rode a requisição **"Registrar Usuário"**.
    3. Rode a requisição **"Login"**. (O token será salvo automaticamente).
    4. Crie uma **Barbearia** (Tenant).
    5. Crie **Serviços** e configure a **Agenda**.

---

## Variáveis de Ambiente (SaaS)

As variáveis de ambiente para a API estão localizadas em `apps/api/.env`.

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão (use `localhost` se estiver testando fora do docker) |
| `REDIS_HOST` | Host do Redis (use `redis` se for interno ao docker, `localhost` se for externo) |
| `RESEND_API_KEY` | Chave da API do Resend para envio de e-mails |

---

## Troubleshooting Docker no Windows

Se encontrar o erro `bind: An attempt was made to access a socket in a way forbidden`, verifique se o NGINX está tentando usar a porta 80. O `docker-compose.yml` atual já deve estar configurado para **8080**.
