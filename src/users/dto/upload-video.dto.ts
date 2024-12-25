/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateVideoDto {
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  desc: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}