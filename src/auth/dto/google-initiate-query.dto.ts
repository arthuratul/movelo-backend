import { IsIn, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class GoogleInitiateQueryDto {
  @IsString()
  client_id: string;

  @IsUrl({ require_tld: false })
  redirect_uri: string;

  @IsString()
  @Length(43, 128)
  code_challenge: string;

  @IsIn(['S256'])
  code_challenge_method: 'S256';

  @IsString()
  @IsOptional()
  state?: string;
}
