/* eslint-disable prettier/prettier */
// user/dto/update-user.dto.ts

import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string; 

  @IsOptional()
  @IsInt()
  followers?: number;

  @IsOptional()
  @IsInt()
  following?: number;

  @IsOptional()
  @IsInt()
  likesCount?: number;
}