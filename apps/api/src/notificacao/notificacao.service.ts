import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AgendamentoConfirmadoJob, ConviteEmailJob } from './notificacao.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERFIL_LABEL: Record<string, string> = {
  gerente: 'gerente',
  barbeiro: 'barbeiro',
  recepcionista: 'recepcionista',
};

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);
  private readonly resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY não configurada — envio de e-mails desabilitado',
      );
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async enviarConfirmacaoAgendamento(data: AgendamentoConfirmadoJob) {
    const inicioFormatado = format(
      new Date(data.inicio),
      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
      { locale: ptBR },
    );

    if (!this.resend) {
      this.logger.warn(
        `E-mail para ${data.clienteEmail} ignorado: RESEND_API_KEY não configurada`,
      );
      return;
    }

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
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao enviar e-mail para ${data.clienteEmail}: ${msg}`,
      );
      throw error; // Permite que o BullMQ tente novamente (retry)
    }
  }

  async enviarLembrete(data: {
    clienteNome: string;
    clienteEmail: string;
    barbeariaNome: string;
    barbeiroNome: string;
    inicio: string;
    servicos: string[];
    tipo: '24h' | '2h';
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `Lembrete para ${data.clienteEmail} ignorado: RESEND_API_KEY não configurada`,
      );
      return;
    }
    const inicioFormatado = format(
      new Date(data.inicio),
      "dd 'de' MMMM 'às' HH:mm",
      { locale: ptBR },
    );
    const assunto =
      data.tipo === '24h'
        ? `Lembrete: amanhã, ${inicioFormatado}`
        : `Lembrete: em breve, ${inicioFormatado}`;
    try {
      await this.resend.emails.send({
        from: 'Toqe <noreply@toqe.com.br>',
        to: data.clienteEmail,
        subject: `✂️ ${assunto} — ${data.barbeariaNome}`,
        html: `<p>Olá, <strong>${data.clienteNome}</strong>!</p>
<p>Você tem um agendamento em <strong>${data.barbeariaNome}</strong> com <strong>${data.barbeiroNome}</strong>.</p>
<p>Data: <strong>${inicioFormatado}</strong></p>
<p>Serviços: ${data.servicos.join(', ')}</p>`,
      });
      this.logger.log(`Lembrete enviado para ${data.clienteEmail}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao enviar e-mail para ${data.clienteEmail}: ${msg}`,
      );
      throw error;
    }
  }

  async enviarEmail(data: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `E-mail para ${data.to} ignorado: RESEND_API_KEY não configurada`,
      );
      return;
    }
    try {
      const result = await this.resend.emails.send({
        from: 'Toqe <noreply@toqe.com.br>',
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      this.logger.log(
        `E-mail enviado para ${data.to} (id: ${result.data?.id})`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao enviar e-mail para ${data.to}: ${msg}`);
      throw error;
    }
  }

  async enviarRecuperacaoSenha(
    email: string,
    nome: string,
    resetLink: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `E-mail de recuperação para ${email} ignorado: RESEND_API_KEY não configurada`,
      );
      return;
    }
    try {
      await this.resend.emails.send({
        from: 'Toqe <noreply@toqe.com.br>',
        to: email,
        subject: '🔑 Recuperação de senha — Toqe',
        html: this.buildRecuperacaoHtml({ nome, resetLink }),
      });
      this.logger.log(`E-mail de recuperação enviado para ${email}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao enviar e-mail de recuperação para ${email}: ${msg}`,
      );
      throw error;
    }
  }

  async enviarConviteEmail(data: ConviteEmailJob): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `Convite para ${data.email} ignorado: RESEND_API_KEY não configurada`,
      );
      return;
    }
    try {
      await this.resend.emails.send({
        from: 'Toqe <noreply@toqe.com.br>',
        to: data.email,
        subject: `✂️ Você foi convidado para ${data.barbeariaNome} — Toqe`,
        html: this.buildConviteHtml(data),
      });
      this.logger.log(`E-mail de convite enviado para ${data.email}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Falha ao enviar e-mail de convite para ${data.email}: ${msg}`,
      );
      throw error; // Permite que o BullMQ tente novamente (retry)
    }
  }

  private buildConviteHtml(data: ConviteEmailJob): string {
    const perfilLabel = PERFIL_LABEL[data.perfil] ?? data.perfil;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Convite</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a1a1a;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px;">✂️ TOQE</h1>
          <p style="margin:8px 0 0;color:#aaaaaa;font-size:14px;">Sistema de Agendamento para Barbearias</p>
        </td></tr>
        <tr><td style="padding:40px 48px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;">Você foi convidado! 🎉</h2>
          <p style="color:#555;font-size:16px;">A barbearia <strong>${data.barbeariaNome}</strong> convidou você para entrar como <strong>${perfilLabel}</strong>.</p>
          <p style="color:#555;">Clique no botão abaixo para aceitar o convite e acessar a plataforma:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${data.conviteLink}" style="background:#f4b400;color:#0d0d0d;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px;">
              Aceitar convite
            </a>
          </div>
          <p style="color:#888;font-size:13px;">Se o botão não funcionar, copie e cole este link no navegador:<br/><a href="${data.conviteLink}" style="color:#888;">${data.conviteLink}</a></p>
          <p style="color:#888;font-size:13px;">Este convite expira em <strong>7 dias</strong>. Se você não esperava este convite, ignore este e-mail.</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:24px 48px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} Toqe — Plataforma de gestão para barbearias.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildRecuperacaoHtml(data: {
    nome: string;
    resetLink: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Recuperação de senha</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a1a1a;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px;">✂️ TOQE</h1>
        </td></tr>
        <tr><td style="padding:40px 48px;">
          <h2 style="margin:0 0 8px;color:#1a1a1a;">Recuperação de senha</h2>
          <p style="color:#555;font-size:16px;">Olá, <strong>${data.nome}</strong>!</p>
          <p style="color:#555;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${data.resetLink}" style="background:#f4b400;color:#0d0d0d;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px;">
              Redefinir senha
            </a>
          </div>
          <p style="color:#888;font-size:13px;">Este link expira em <strong>1 hora</strong>. Se você não solicitou, ignore este e-mail — sua senha não será alterada.</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:24px 48px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} Toqe — Plataforma de gestão para barbearias.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
