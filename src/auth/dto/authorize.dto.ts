import { IsEmail, IsIn, IsString, Length, MinLength } from 'class-validator';

export class AuthorizeDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(43, 128)
  code_challenge: string;

  @IsIn(['S256'])
  code_challenge_method: 'S256';
}
