import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AsaasEvent {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_DELETED = 'PAYMENT_DELETED',
  SUBSCRIPTION_INACTIVATED = 'SUBSCRIPTION_INACTIVATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
}

class AsaasPaymentDto {
  @IsString()
  @MaxLength(100)
  subscription: string;

  @IsISO8601()
  dueDate: string;
}

class AsaasSubscriptionDto {
  @IsString()
  @MaxLength(100)
  id: string;

  @IsString()
  status: string;

  @IsISO8601()
  nextDueDate: string;
}

export class AsaasWebhookPayload {
  @IsEnum(AsaasEvent)
  event: AsaasEvent;

  @IsOptional()
  @ValidateNested()
  @Type(() => AsaasPaymentDto)
  payment?: AsaasPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AsaasSubscriptionDto)
  subscription?: AsaasSubscriptionDto;
}
