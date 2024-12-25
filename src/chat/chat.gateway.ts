/* eslint-disable prettier/prettier */
// src/chat/chat.gateway.ts
import { UseGuards } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
    cors: {
        origin: '*', // Đảm bảo cấu hình CORS phù hợp
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly usersService: UsersService,
    ) { }
    @WebSocketServer() server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendMessage')
    @UseGuards(JwtAuthGuard)
    async handleMessage(client: Socket, payload: any): Promise<void> {
        const { senderId, receiverId, content, type } = payload;

        // Lưu tin nhắn vào cơ sở dữ liệu
        const message = await this.usersService.sendMessage(senderId, receiverId, content, type);

        // Phát tin nhắn real-time đến người nhận
        this.server.to(receiverId).emit('receiveMessage', message);
    }

    @SubscribeMessage('joinRoom')
    @UseGuards(JwtAuthGuard)
    joinRoom(client: Socket, roomId: string): void {
        client.join(roomId);
        console.log(`Client ${client.id} joined room: ${roomId}`);
    }

    @SubscribeMessage('sendNotification')
    @UseGuards(JwtAuthGuard)
    handleNotification(client: Socket, payload: any): void {
        const { recipientId, notification } = payload;

        // Phát thông báo đến người nhận
        this.server.to(recipientId).emit('receiveNotification', notification);
    }
}