import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

export interface AsaasSubscription {
  id: string;
  customerId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OVERDUE' | 'EXPIRED';
  nextDueDate: string;
  value: number;
  cycle: 'MONTHLY';
}

export interface AsaasCheckoutLink {
  url: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3';
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'ASAAS_API_KEY não configurada — integração de pagamentos desabilitada',
      );
    }
    this.apiKey = apiKey ?? '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      access_token: this.apiKey,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'ASAAS_API_KEY não configurada — configure-a para usar pagamentos',
      );
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Asaas ${method} ${path} → ${res.status}: ${err}`);
      throw new Error(`Asaas API error ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async createCustomer(nome: string, email: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('POST', '/customers', {
      name: nome,
      email,
    });
  }

  async createSubscription(
    customerId: string,
    plano: string,
    nextDueDate: string,
  ): Promise<AsaasSubscription> {
    const PRECOS: Record<string, number> = {
      basic: 49,
      pro: 99,
      enterprise: 249,
    };
    return this.request<AsaasSubscription>('POST', '/subscriptions', {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: PRECOS[plano] ?? 99,
      nextDueDate,
      cycle: 'MONTHLY',
      description: `Toqe - Plano ${plano}`,
    });
  }

  async getPaymentLink(subscriptionId: string): Promise<AsaasCheckoutLink> {
    return this.request<AsaasCheckoutLink>(
      'GET',
      `/subscriptions/${subscriptionId}/paymentLink`,
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request('DELETE', `/subscriptions/${subscriptionId}`);
  }
}
