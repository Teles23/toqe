import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token a ser revogado' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
