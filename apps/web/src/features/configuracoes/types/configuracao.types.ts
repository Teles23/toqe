export type SecaoId =
  | "barbearia"
  | "horarios"
  | "notificacoes"
  | "plano"
  | "seguranca"
  | "qrcode"
  | "api-keys";

export interface ApiKey {
  codigo: number;
  barCodigo: number;
  nome: string;
  keyPrefix: string;
  ativo: boolean;
  criadoEm: string;
  ultimoUsoEm: string | null;
}
