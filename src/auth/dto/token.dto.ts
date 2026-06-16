import { IsIn, IsOptional, IsString } from 'class-validator';

export class TokenDto {
  @IsIn(['authorization_code', 'refresh_token'])
  grant_type: 'authorization_code' | 'refresh_token';

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  code_verifier?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;
}
