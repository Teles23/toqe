# Relatório de Implementação — Notificações: BullMQ + Resend

Este documento registra o que foi desenvolvido no módulo de notificações assíncronas.

---

## Arquitetura

O sistema de notificações é totalmente **desacoplado** do fluxo de agendamento. Isso garante que:
- A API responde ao cliente assim que o agendamento é salvo no banco
- O envio de e-mail acontece em background sem atrasar a resposta
- Em caso de falha no envio, o BullMQ tenta automaticamente até 3 vezes com backoff exponencial (5s, 10s, 20s)

```
POST /agendamentos
    ↓ (síncrono)
AgendamentoService — salva no banco
    ↓ (síncrono)
NotificacaoProducer — publica job na fila Redis "notificacoes"
    ↓ (API retorna 201 imediatamente)

[Background Worker]
NotificacaoConsumer — processa o job da fila
    ↓
NotificacaoService — envia e-mail via Resend API
```

---

## Arquivos Criados

| Arquivo | Responsabilidade |
|---|---|
| `src/notificacao/notificacao.types.ts` | Interface dos dados do job |
| `src/notificacao/notificacao.producer.ts` | Publica jobs na fila BullMQ |
| `src/notificacao/notificacao.consumer.ts` | Processa a fila e delega ao service |
| `src/notificacao/notificacao.service.ts` | Chama o Resend e renderiza o template HTML |
| `src/notificacao/notificacao.module.ts` | Registra a fila e exporta o Producer |

---

## Dependências Instaladas

- `@nestjs/bull` — Integração do BullMQ com NestJS
- `bull` — Core da fila baseada em Redis
- `resend` — SDK do provedor de e-mail Resend

---

## Configuração Necessária

No arquivo `apps/api/.env`, adicionar:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```
Obter a chave em: https://resend.com

---

## E-mail de Confirmação

O template HTML inclui:
- Identidade visual do Toqe (dark header)
- Dados detalhados do agendamento (barbearia, barbeiro, data/hora, lista de serviços)
- Código do agendamento para referência
- Rodapé com aviso de e-mail automático

---

## Retry Policy

Em caso de falha (Resend fora do ar, rate limit, etc.):
- **3 tentativas** automáticas
- **Backoff exponencial**: 5s → 10s → 20s
- Falhas são registradas no logger com nível `error`
