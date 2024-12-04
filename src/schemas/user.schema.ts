/* eslint-disable prettier/prettier */
// user/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  [x: string]: any;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop({ type: String })
  resetOtp: string;

  @Prop({ type: Date })
  resetOtpExpire: Date;

  @Prop({ type: Object })
  avatar?: string;

  @Prop({ unique: true })
  username: string;

  @Prop({ default: '' })
  bio?: string;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ default: 0 })
  likesCount: number;


  constructor(user: Partial<User>) {
    this._id = user._id ? user._id.toString() : undefined;
    this.email = user.email;
    this.password = user.password;
    this.role = user.role || 'user';
    this.isActive = user.isActive || false;
    this.createdAt = user.createdAt || new Date();
    this.avatar = user.avatar;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);