/* eslint-disable prettier/prettier */
// user/dto/create-user.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  avatar?: { uid: string } | null;
}
