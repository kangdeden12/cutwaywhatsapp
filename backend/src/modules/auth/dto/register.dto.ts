import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(72) // batas aman argon2
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;
}
