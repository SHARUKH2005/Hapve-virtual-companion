import { DataSource } from 'typeorm';
import { Identity } from '../db/entities/Identity';
import { Conversation } from '../db/entities/Conversation';
import { Message } from '../db/entities/Message';
import { Persona } from '../db/entities/Persona';
import { Memory } from '../db/entities/Memory';
import { Companion } from '../db/entities/Companion';
import { AnalyticsEvent } from '../db/entities/AnalyticsEvent';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'virtual_companion',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false, // Disable logging to reduce noise
    entities: [Identity, Conversation, Message, Persona, Memory, Companion, AnalyticsEvent],
    migrations: ['src/db/migrations/*.ts'],
    subscribers: [],
});

// Track if database is available
let isDatabaseConnected = false;

export const connectDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        isDatabaseConnected = true;
        console.log('✅ Connected to PostgreSQL database');
    } catch (error) {
        isDatabaseConnected = false;
        console.log('ℹ️ Running without database (all data stored in memory/localStorage)');
        // Do NOT throw - allow app to continue
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        if (isDatabaseConnected) {
            await AppDataSource.destroy();
        }
    } catch {
        // Ignore disconnect errors
    }
};

export const isDatabaseAvailable = (): boolean => {
    return isDatabaseConnected;
};
