import { IsIn, IsString } from 'class-validator';

export class TokenDto {
  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsIn(['authorization_code'])
  grant_type: 'authorization_code';

  @IsString()
  code: string;

  @IsString()
  code_verifier: string;
}
