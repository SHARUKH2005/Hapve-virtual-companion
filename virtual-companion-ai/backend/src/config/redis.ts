import { createClient } from 'redis';

// Create Redis client (optional - only for caching)
export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Silently ignore all Redis errors (app works fine without it)
redisClient.on('error', () => {
    // Suppress error messages - Redis is optional
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis (caching enabled)');
});

// Connect to Redis (non-blocking)
export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
    } catch (error) {
        // Silently fail - app works without Redis
        console.log('ℹ️ Running without Redis (caching disabled)');
    }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
    try {
        await redisClient.quit();
    } catch {
        // Ignore disconnect errors
    }
};
