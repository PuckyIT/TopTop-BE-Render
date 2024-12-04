/* eslint-disable prettier/prettier */
// user/dto/reset-password.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}