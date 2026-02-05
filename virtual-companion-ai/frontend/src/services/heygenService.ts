/**
 * HeyGen Streaming Avatar Service
 * Provides photo-realistic live avatars with voice
 */

import StreamingAvatar, {
    AvatarQuality,
    StreamingEvents,
    TaskType,
    TaskMode,
    VoiceEmotion
} from '@heygen/streaming-avatar';

export interface HeyGenConfig {
    accessToken: string;
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
}

export interface HeyGenCallbacks {
    onReady?: () => void;
    onTalking?: () => void;
    onStopTalking?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

class HeyGenAvatarService {
    private avatar: StreamingAvatar | null = null;
    private isConnected: boolean = false;
    private callbacks: HeyGenCallbacks = {};

    /**
     * Initialize and start HeyGen avatar session
     */
    async startAvatar(config: HeyGenConfig, callbacks: HeyGenCallbacks = {}): Promise<MediaStream | null> {
        this.callbacks = callbacks;

        try {
            console.log('[HeyGen] Starting avatar session...');

            // Create streaming avatar instance
            this.avatar = new StreamingAvatar({ token: config.accessToken });

            // Set up event listeners
            this.avatar.on(StreamingEvents.STREAM_READY, () => {
                console.log('[HeyGen] ✅ Stream ready');
                this.isConnected = true;
                this.callbacks.onReady?.();
            });

            this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
                console.log('[HeyGen] 🗣️ Avatar talking');
                this.callbacks.onTalking?.();
            });

            this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
                console.log('[HeyGen] ⏹️ Avatar stopped talking');
                this.callbacks.onStopTalking?.();
            });

            this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
                console.log('[HeyGen] ❌ Disconnected');
                this.isConnected = false;
                this.callbacks.onDisconnect?.();
            });

            // Map quality
            const qualityMap: Record<string, AvatarQuality> = {
                'low': AvatarQuality.Low,
                'medium': AvatarQuality.Medium,
                'high': AvatarQuality.High
            };

            // Create avatar session
            const session = await this.avatar.createStartAvatar({
                quality: qualityMap[config.quality || 'high'],
                avatarName: config.avatarId || 'default',
                voice: {
                    voiceId: config.voiceId || 'default',
                    rate: 1.0,
                    emotion: VoiceEmotion.FRIENDLY
                },
                language: 'en'
            });

            console.log('[HeyGen] ✅ Avatar session created');
            return (session as any)?.stream || null;

        } catch (error) {
            console.error('[HeyGen] Failed to start avatar:', error);
            this.callbacks.onError?.(error as Error);
            return null;
        }
    }

    /**
     * Make avatar speak text
     */
    async speak(text: string): Promise<void> {
        if (!this.avatar || !this.isConnected) {
            console.warn('[HeyGen] Avatar not connected');
            return;
        }

        try {
            await this.avatar.speak({
                text,
                task_type: TaskType.TALK,
                taskMode: TaskMode.SYNC
            });
        } catch (error) {
            console.error('[HeyGen] Speak failed:', error);
        }
    }

    /**
     * Start voice chat mode
     */
    async startVoiceChat(): Promise<void> {
        if (!this.avatar || !this.isConnected) return;

        try {
            await this.avatar.startVoiceChat({
                isInputAudioMuted: false
            });
            console.log('[HeyGen] Voice chat started');
        } catch (error) {
            console.error('[HeyGen] Voice chat failed:', error);
        }
    }

    /**
     * Stop voice chat
     */
    async stopVoiceChat(): Promise<void> {
        if (!this.avatar) return;

        try {
            await this.avatar.closeVoiceChat();
            console.log('[HeyGen] Voice chat stopped');
        } catch (error) {
            console.error('[HeyGen] Stop voice chat failed:', error);
        }
    }

    /**
     * Interrupt avatar speaking
     */
    async interrupt(): Promise<void> {
        if (!this.avatar) return;

        try {
            await this.avatar.interrupt();
        } catch (error) {
            console.error('[HeyGen] Interrupt failed:', error);
        }
    }

    /**
     * Stop avatar session
     */
    async stopAvatar(): Promise<void> {
        if (!this.avatar) return;

        try {
            await this.avatar.stopAvatar();
            this.avatar = null;
            this.isConnected = false;
            console.log('[HeyGen] Avatar stopped');
        } catch (error) {
            console.error('[HeyGen] Stop failed:', error);
        }
    }

    /**
     * Check if avatar is connected
     */
    isActive(): boolean {
        return this.isConnected;
    }
}

// Singleton instance
export const heygenService = new HeyGenAvatarService();
export default heygenService;
