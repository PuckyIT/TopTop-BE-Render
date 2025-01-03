/* eslint-disable prettier/prettier */
// user/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

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

  @Prop({ type: [{ type: String }], default: [] })
  followers: string[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  friendRequests: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  friends: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  following: mongoose.Types.ObjectId[];

  constructor(user: Partial<User>) {
    this._id = user._id;
    this.email = user.email;
    this.password = user.password;
    this.role = user.role || 'user';
    this.isActive = user.isActive || false;
    this.createdAt = user.createdAt || new Date();
    this.avatar = user.avatar;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);