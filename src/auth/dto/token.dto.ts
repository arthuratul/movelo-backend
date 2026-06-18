import { IsIn, IsString, Length } from 'class-validator';

export class TokenDto {
  @IsString()
  client_id: string;

  @IsIn(['authorization_code'])
  grant_type: 'authorization_code';

  @IsString()
  code: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  @Length(43, 128)
  code_verifier: string;
}
