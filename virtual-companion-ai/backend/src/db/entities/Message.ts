import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Conversation } from './Conversation';

export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
}

export enum EmotionType {
    NEUTRAL = 'neutral',
    HAPPY = 'happy',
    SAD = 'sad',
    ANGRY = 'angry',
    FEARFUL = 'fearful',
    SURPRISED = 'surprised',
    DISGUSTED = 'disgusted',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Conversation, conversation => conversation.messages)
    conversation!: Conversation;

    @Column({ type: 'uuid' })
    conversationId!: string;

    @Column({ type: 'enum', enum: MessageRole })
    role!: MessageRole;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'enum', enum: EmotionType, nullable: true })
    detectedEmotion?: EmotionType;

    @Column({ type: 'float', nullable: true })
    emotionConfidence?: number;

    @Column({ type: 'float', nullable: true })
    sentimentScore?: number; // -1 to 1 (negative to positive)

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        tokens?: number;
        latency?: number;
        modelUsed?: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    explanation?: {
        intent?: string;
        moodDetected?: string;
        basePersonality?: string;
        referencedMemories?: string[];
    };

    @Column({ type: 'boolean', default: false })
    isImportant!: boolean; // Flagged for long-term memory

    @CreateDateColumn()
    createdAt!: Date;
}
