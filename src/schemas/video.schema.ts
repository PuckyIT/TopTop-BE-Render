/* eslint-disable prettier/prettier */
// src/schemas/video.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoDocument = Video & Document;

@Schema({ timestamps: true })
export class Video {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  desc: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  savedBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  sharedBy: Types.ObjectId[];

  @Prop({
    type: [{
      _id: { type: Types.ObjectId },
      userId: { type: Types.ObjectId, ref: 'User' },
      content: String,
      createdAt: { type: Date, default: Date.now },
      username: { type: String, ref: 'User' },
      avatar: { type: String, ref: 'User' }
    }], default: []
  })
  comments: Array<{
    _id: Types.ObjectId; userId: Types.ObjectId; content: string;
    createdAt: Date; username: string; avatar: string;
  }>;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  saved: number;

  @Prop({ default: 0 })
  shared: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isPublic: boolean;
}

export const VideoSchema = SchemaFactory.createForClass(Video);