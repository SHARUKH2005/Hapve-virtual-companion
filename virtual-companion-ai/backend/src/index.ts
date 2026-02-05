import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools / same-origin / server-to-server calls
        if (!origin) return callback(null, true);

        const allowlist = new Set<string>([
            process.env.FRONTEND_URL || '',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3006',
            'http://localhost:3007',
            'http://localhost:5173',
        ].filter(Boolean));

        if (allowlist.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public')); // Serve generated models and assets

// Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// Initialization
const startServer = async () => {
    // Always start the server FIRST to ensure port binding
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🚀 Virtual Companion AI Backend - READY                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📡 Server URL: http://localhost:${PORT}
🔐 Authentication: Enabled
🧠 AI Engine: Ready
💾 Storage: LocalStorage (Database optional)

✅ Server is running and ready to accept requests!
      `);
    });

    // Try to connect to optional services (non-blocking) in background
    connectDatabase();
    connectRedis();
};

startServer();
