import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AgendamentoConfirmadoJob } from './notificacao.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async enviarConfirmacaoAgendamento(data: AgendamentoConfirmadoJob) {
    const inicioFormatado = format(
      new Date(data.inicio),
      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
      { locale: ptBR },
    );

    const servicosList = data.servicos.map((s) => `• ${s}`).join('\n');

    try {
      const result = await this.resend.emails.send({
        from: 'Toqe <noreply@toqe.com.br>',
        to: data.clienteEmail,
        subject: `✂️ Agendamento confirmado — ${data.barbeariaNome}`,
        html: this.buildEmailHtml({
          ...data,
          inicioFormatado,
          servicosList: data.servicos,
        }),
      });

      this.logger.log(
        `E-mail de confirmação enviado para ${data.clienteEmail} (id: ${result.data?.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail para ${data.clienteEmail}: ${error.message}`,
      );
      throw error; // Permite que o BullMQ tente novamente (retry)
    }
  }

  private buildEmailHtml(data: {
    clienteNome: string;
    barbeariaNome: string;
    barbeiroNome: string;
    inicioFormatado: string;
    servicosList: string[];
    agendamentoCodigo: number;
  }): string {
    const servicos = data.servicosList.map((s) => `<li>${s}</li>`).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agendamento Confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;">✂️ TOQE</h1>
              <p style="margin:8px 0 0;color:#aaaaaa;font-size:14px;">Sistema de Agendamento para Barbearias</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;">Agendamento confirmado! 🎉</h2>
              <p style="margin:0 0 32px;color:#555555;font-size:16px;">Olá, <strong>${data.clienteNome}</strong>! Seu horário está reservado.</p>

              <!-- Card de Detalhes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border:1px solid #eeeeee;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Barbearia</p>
                          <p style="margin:4px 0 0;color:#1a1a1a;font-size:16px;font-weight:600;">${data.barbeariaNome}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Barbeiro</p>
                          <p style="margin:4px 0 0;color:#1a1a1a;font-size:16px;font-weight:600;">${data.barbeiroNome}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Data e Hora</p>
                          <p style="margin:4px 0 0;color:#1a1a1a;font-size:16px;font-weight:600;">${data.inicioFormatado}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Serviços</p>
                          <ul style="margin:4px 0 0;padding-left:20px;color:#1a1a1a;font-size:15px;">${servicos}</ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#888888;font-size:13px;">
                Código do agendamento: <strong>#${data.agendamentoCodigo}</strong><br/>
                Em caso de dúvidas, entre em contato diretamente com a barbearia.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 48px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;color:#aaaaaa;font-size:12px;">
                © ${new Date().getFullYear()} Toqe — Plataforma de gestão para barbearias.<br/>
                Este e-mail foi enviado automaticamente. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
