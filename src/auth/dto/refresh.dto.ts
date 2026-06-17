import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsString()
  refresh_token: string;
}