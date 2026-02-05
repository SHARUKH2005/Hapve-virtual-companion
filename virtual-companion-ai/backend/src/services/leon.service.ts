import axios from 'axios';
import { io, Socket } from 'socket.io-client';

/**
 * Leon AI Backend Service
 * Handles server-side integration with Leon AI
 */

interface LeonBackendConfig {
    leonHost: string;
    leonPort: number;
    leonApiKey?: string;
    language?: string;
}

export class LeonBackendService {
    private config: LeonBackendConfig;
    private socket: Socket | null = null;
    private isConnected: boolean = false;

    constructor(config: Partial<LeonBackendConfig> = {}) {
        this.config = {
            leonHost: config.leonHost || process.env.LEON_HOST || 'http://localhost',
            leonPort: config.leonPort || parseInt(process.env.LEON_PORT || '1337'),
            leonApiKey: config.leonApiKey || process.env.LEON_API_KEY,
            language: config.language || 'en-US'
        };
    }

    /**
     * Connect to Leon AI server
     */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const leonUrl = `${this.config.leonHost}:${this.config.leonPort}`;

            console.log(`[Leon Backend] Connecting to ${leonUrl}...`);

            this.socket = io(leonUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('[Leon Backend] Connected successfully');
                this.isConnected = true;
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('[Leon Backend] Disconnected');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Leon Backend] Connection error:', error);
                this.isConnected = false;
                reject(error);
            });
        });
    }

    /**
     * Disconnect from Leon AI
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Send query to Leon AI
     */
    async query(text: string, userId?: string): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Not connected to Leon AI');
        }

        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Leon AI response timeout'));
            }, 30000);

            this.socket.once('answer', (data: any) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket.emit('query', {
                client: 'backend-service',
                value: text,
                lang: this.config.language,
                userId
            });
        });
    }

    /**
     * Process text-to-speech
     */
    async textToSpeech(text: string): Promise<Buffer> {
        try {
            const response = await axios.post(
                `${this.config.leonHost}:${this.config.leonPort}/api/tts`,
                {
                    text,
                    lang: this.config.language
                },
                {
                    headers: {
                        'X-API-Key': this.config.leonApiKey
                    },
                    responseType: 'arraybuffer'
                }
            );

            return Buffer.from(response.data);
        } catch (error) {
            console.error('[Leon Backend] TTS error:', error);
            throw new Error('Failed to generate speech');
        }
    }

    /**
     * Process speech-to-text
     */
    async speechToText(audioBuffer: Buffer): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('audio', new Blob([audioBuffer]));

            const response = await axios.post(
                `${this.config.leonHost}:${this.config.leonPort}/api/stt`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': this.config.leonApiKey
                    }
                }
            );

            return response.data.text || '';
        } catch (error) {
            console.error('[Leon Backend] STT error:', error);
            throw new Error('Failed to transcribe speech');
        }
    }

    /**
     * Get Leon's available skills
     */
    async getSkills(): Promise<any[]> {
        try {
            const response = await axios.get(
                `${this.config.leonHost}:${this.config.leonPort}/api/skills`,
                {
                    headers: {
                        'X-API-Key': this.config.leonApiKey
                    }
                }
            );
            return response.data.skills || [];
        } catch (error) {
            console.error('[Leon Backend] Failed to get skills:', error);
            return [];
        }
    }

    /**
     * Check Leon AI health
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await axios.get(
                `${this.config.leonHost}:${this.config.leonPort}/api/health`,
                { timeout: 5000 }
            );
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get connection status
     */
    isLeonConnected(): boolean {
        return this.isConnected;
    }
}

// Singleton instance
let leonBackendInstance: LeonBackendService | null = null;

/**
 * Get Leon Backend Service instance
 */
export function getLeonBackendService(config?: Partial<LeonBackendConfig>): LeonBackendService {
    if (!leonBackendInstance) {
        leonBackendInstance = new LeonBackendService(config);
    }
    return leonBackendInstance;
}

export default LeonBackendService;
