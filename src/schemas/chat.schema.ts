/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sender: Types.ObjectId; // Người gửi

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    receiver: Types.ObjectId; // Người nhận

    @Prop({ type: String, required: true })
    content: string; // Nội dung tin nhắn (text/link)

    @Prop({ type: String, enum: ['text', 'video', 'image'], default: 'text' })
    type: 'text' | 'video' | 'image'; // Loại tin nhắn

    @Prop({ default: Date.now })
    createdAt: Date; // Thời gian gửi tin nhắn
}

export const ChatSchema = SchemaFactory.createForClass(Chat);