/* eslint-disable prettier/prettier */
// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    providers: [ChatGateway],
})
export class ChatModule { }