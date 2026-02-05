import StreamingAvatar, {
    AvatarQuality,
    StreamingEvents,
    TaskType,
    TaskMode,
    VoiceEmotion,
    STTProvider,
    VoiceChatTransport
} from '@heygen/streaming-avatar';

export class HeyGenAvatarService {
    private avatar: StreamingAvatar | null = null;
    private accessToken: string;
    private sessionInfo: any = null;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * Initialize and start avatar session
     */
    async startAvatar(config: {
        avatarId?: string;
        voiceId?: string;
        quality?: AvatarQuality;
        onReady?: () => void;
        onTalking?: (event: any) => void;
        onStopTalking?: (event: any) => void;
        onDisconnect?: () => void;
    }) {
        try {
            console.log('[HeyGen] Initializing avatar...');

            // Create streaming avatar instance
            this.avatar = new StreamingAvatar({ token: this.accessToken });

            // Set up event listeners
            this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
                console.log('[HeyGen] Stream ready:', event);
                if (config.onReady) config.onReady();
            });

            this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
                console.log('[HeyGen] Avatar started talking');
                if (config.onTalking) config.onTalking(event);
            });

            this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
                console.log('[HeyGen] Avatar stopped talking');
                if (config.onStopTalking) config.onStopTalking(event);
            });

            this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
                console.log('[HeyGen] Stream disconnected');
                if (config.onDisconnect) config.onDisconnect();
            });

            // Create avatar session
            this.sessionInfo = await this.avatar.createStartAvatar({
                quality: config.quality || AvatarQuality.High,
                avatarName: config.avatarId || 'default',
                voice: {
                    voiceId: config.voiceId || 'default',
                    rate: 1.0,
                    emotion: VoiceEmotion.FRIENDLY,
                },
                sttSettings: {
                    provider: STTProvider.DEEPGRAM,
                    confidence: 0.55,
                },
                language: 'en',
                voiceChatTransport: VoiceChatTransport.WEBSOCKET,
                activityIdleTimeout: 300, // 5 minutes
            });

            console.log('[HeyGen] ✅ Avatar session created:', this.sessionInfo);
            return this.sessionInfo;

        } catch (error) {
            console.error('[HeyGen] Failed to start avatar:', error);
            throw error;
        }
    }

    /**
     * Make avatar speak text
     */
    async speak(text: string) {
        if (!this.avatar) {
            throw new Error('Avatar not initialized');
        }

        try {
            await this.avatar.speak({
                text,
                task_type: TaskType.TALK,
                taskMode: TaskMode.SYNC,
            });
        } catch (error) {
            console.error('[HeyGen] Speak failed:', error);
            throw error;
        }
    }

    /**
     * Start voice chat mode
     */
    async startVoiceChat() {
        if (!this.avatar) {
            throw new Error('Avatar not initialized');
        }

        try {
            await this.avatar.startVoiceChat({
                isInputAudioMuted: false,
            });
            console.log('[HeyGen] Voice chat started');
        } catch (error) {
            console.error('[HeyGen] Voice chat failed:', error);
            throw error;
        }
    }

    /**
     * Stop voice chat mode
     */
    async stopVoiceChat() {
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
    async interrupt() {
        if (!this.avatar) return;

        try {
            await this.avatar.interrupt();
            console.log('[HeyGen] Avatar interrupted');
        } catch (error) {
            console.error('[HeyGen] Interrupt failed:', error);
        }
    }

    /**
     * Start listening mode
     */
    async startListening() {
        if (!this.avatar) return;

        try {
            await this.avatar.startListening();
            console.log('[HeyGen] Avatar listening');
        } catch (error) {
            console.error('[HeyGen] Start listening failed:', error);
        }
    }

    /**
     * Stop listening mode
     */
    async stopListening() {
        if (!this.avatar) return;

        try {
            await this.avatar.stopListening();
            console.log('[HeyGen] Avatar stopped listening');
        } catch (error) {
            console.error('[HeyGen] Stop listening failed:', error);
        }
    }

    /**
     * Keep session alive
     */
    async keepAlive() {
        if (!this.avatar) return;

        try {
            await this.avatar.keepAlive();
            console.log('[HeyGen] Session kept alive');
        } catch (error) {
            console.error('[HeyGen] Keep alive failed:', error);
        }
    }

    /**
     * Stop avatar session
     */
    async stopAvatar() {
        if (!this.avatar) return;

        try {
            await this.avatar.stopAvatar();
            console.log('[HeyGen] Avatar stopped');
            this.avatar = null;
            this.sessionInfo = null;
        } catch (error) {
            console.error('[HeyGen] Stop avatar failed:', error);
        }
    }

    /**
     * Get video stream
     */
    getVideoStream(): MediaStream | null {
        if (!this.sessionInfo) return null;
        return this.sessionInfo.stream || null;
    }

    /**
     * Check if avatar is active
     */
    isActive(): boolean {
        return this.avatar !== null && this.sessionInfo !== null;
    }
}

// Singleton instance
let heygenService: HeyGenAvatarService | null = null;

export function initializeHeyGen(accessToken: string): HeyGenAvatarService {
    if (!heygenService) {
        heygenService = new HeyGenAvatarService(accessToken);
    }
    return heygenService;
}

export function getHeyGenService(): HeyGenAvatarService | null {
    return heygenService;
}
