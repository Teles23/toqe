export interface AsaasWebhookPayload {
  event:
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_DELETED'
    | 'SUBSCRIPTION_INACTIVATED'
    | 'SUBSCRIPTION_RENEWED';
  payment?: {
    subscription: string;
    dueDate: string;
  };
  subscription?: {
    id: string;
    status: string;
    nextDueDate: string;
  };
}
