import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePreferenciasDto {
  @ApiProperty({
    example: true,
    description: 'Receber notificações por e-mail',
  })
  @IsBoolean()
  email: boolean;

  @ApiProperty({
    example: false,
    description: 'Receber notificações por push (app mobile)',
  })
  @IsBoolean()
  push: boolean;

  @ApiProperty({
    example: false,
    description: 'Receber notificações por WhatsApp',
  })
  @IsBoolean()
  whatsapp: boolean;

  @ApiProperty({ example: false, description: 'Receber notificações por SMS' })
  @IsBoolean()
  sms: boolean;
}
