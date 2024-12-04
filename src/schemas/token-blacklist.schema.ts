/* eslint-disable prettier/prettier */
// auth/schemas/token-blacklist.schema.ts

import { Schema, Document } from 'mongoose';

export const TokenBlacklistSchema = new Schema(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
    },
    {
        collection: 'token_blacklist', // Tên collection trong MongoDB
    },
);

export interface TokenBlacklist extends Document {
    token: string;
    userId: string;
    createdAt: Date;
}