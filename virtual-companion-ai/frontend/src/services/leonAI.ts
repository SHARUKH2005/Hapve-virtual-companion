import axios from 'axios';
import { io, Socket } from 'socket.io-client';

/**
 * Leon AI Service Integration
 * Connects the alive avatar with Leon AI for voice interaction
 */

export interface LeonConfig {
    host?: string;
    port?: number;
    apiKey?: string;
    language?: string;
}

export interface LeonResponse {
    success: boolean;
    message?: string;
    speech?: string;
    audioUrl?: string;
    data?: any;
}

export class LeonAIService {
    private socket: Socket | null = null;
    private config: Required<LeonConfig>;
    private isConnected: boolean = false;
    private messageQueue: Array<{ text: string; resolve: Function; reject: Function }> = [];

    constructor(config: LeonConfig = {}) {
        this.config = {
            host: config.host || 'http://localhost',
            port: config.port || 1337,
            apiKey: config.apiKey || '',
            language: config.language || 'en-US'
        };
    }

    /**
     * Initialize connection to Leon AI server
     */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const leonUrl = `${this.config.host}:${this.config.port}`;

            console.log(`[Leon AI] Connecting to ${leonUrl}...`);

            this.socket = io(leonUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('[Leon AI] Connected successfully');
                this.isConnected = true;
                this.processMessageQueue();
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('[Leon AI] Disconnected');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Leon AI] Connection error:', error);
                this.isConnected = false;
                reject(error);
            });

            // Listen for Leon's responses
            this.socket.on('answer', (data: any) => {
                console.log('[Leon AI] Received answer:', data);
                this.handleLeonResponse(data);
            });

            this.socket.on('is-typing', (data: any) => {
                console.log('[Leon AI] Leon is typing...');
            });

            this.socket.on('recognized', (data: any) => {
                console.log('[Leon AI] Speech recognized:', data);
            });
        });
    }

    /**
     * Disconnect from Leon AI server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            console.log('[Leon AI] Disconnected');
        }
    }

    /**
     * Send a text query to Leon AI
     */
    async query(text: string): Promise<LeonResponse> {
        if (!this.isConnected || !this.socket) {
            console.warn('[Leon AI] Not connected, attempting to reconnect...');
            try {
                await this.connect();
            } catch (error) {
                return {
                    success: false,
                    message: 'Failed to connect to Leon AI'
                };
            }
        }

        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Leon AI response timeout'));
            }, 30000); // 30 second timeout

            // Store the promise handlers
            this.messageQueue.push({ text, resolve, reject });

            // Send query to Leon
            this.socket.emit('query', {
                client: 'web-app',
                value: text,
                lang: this.config.language
            });

            // Clear timeout when response is received
            this.socket.once('answer', () => {
                clearTimeout(timeout);
            });
        });
    }

    /**
     * Process queued messages
     */
    private processMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const { text } = this.messageQueue[0];
            if (this.socket) {
                this.socket.emit('query', {
                    client: 'web-app',
                    value: text,
                    lang: this.config.language
                });
            }
        }
    }

    /**
     * Handle Leon's response
     */
    private handleLeonResponse(data: any): void {
        if (this.messageQueue.length === 0) return;

        const { resolve } = this.messageQueue.shift()!;

        const response: LeonResponse = {
            success: true,
            message: data.text || data.speech || '',
            speech: data.speech,
            audioUrl: data.audio_url,
            data: data
        };

        resolve(response);
    }

    /**
     * Send voice input to Leon (if using speech recognition)
     */
    async sendVoiceInput(audioBlob: Blob): Promise<LeonResponse> {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await axios.post(
                `${this.config.host}:${this.config.port}/api/speech`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-API-Key': this.config.apiKey
                    }
                }
            );

            return {
                success: true,
                message: response.data.text,
                speech: response.data.speech,
                audioUrl: response.data.audio_url,
                data: response.data
            };
        } catch (error) {
            console.error('[Leon AI] Voice input error:', error);
            return {
                success: false,
                message: 'Failed to process voice input'
            };
        }
    }

    /**
     * Get Leon's voice output as audio
     */
    async getVoiceOutput(text: string): Promise<string | null> {
        try {
            const response = await axios.post(
                `${this.config.host}:${this.config.port}/api/tts`,
                { text, lang: this.config.language },
                {
                    headers: {
                        'X-API-Key': this.config.apiKey
                    },
                    responseType: 'blob'
                }
            );

            // Convert blob to URL
            const audioBlob = new Blob([response.data], { type: 'audio/wav' });
            return URL.createObjectURL(audioBlob);
        } catch (error) {
            console.error('[Leon AI] TTS error:', error);
            return null;
        }
    }

    /**
     * Check if Leon AI server is available
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await axios.get(
                `${this.config.host}:${this.config.port}/api/health`,
                { timeout: 5000 }
            );
            return response.status === 200;
        } catch (error) {
            console.error('[Leon AI] Health check failed:', error);
            return false;
        }
    }

    /**
     * Get available Leon skills
     */
    async getSkills(): Promise<any[]> {
        try {
            const response = await axios.get(
                `${this.config.host}:${this.config.port}/api/skills`,
                {
                    headers: {
                        'X-API-Key': this.config.apiKey
                    }
                }
            );
            return response.data.skills || [];
        } catch (error) {
            console.error('[Leon AI] Failed to get skills:', error);
            return [];
        }
    }

    /**
     * Check if connected
     */
    isLeonConnected(): boolean {
        return this.isConnected;
    }
}

// Singleton instance
let leonInstance: LeonAIService | null = null;

/**
 * Get or create Leon AI service instance
 */
export function getLeonAI(config?: LeonConfig): LeonAIService {
    if (!leonInstance) {
        leonInstance = new LeonAIService(config);
    }
    return leonInstance;
}

export default LeonAIService;
