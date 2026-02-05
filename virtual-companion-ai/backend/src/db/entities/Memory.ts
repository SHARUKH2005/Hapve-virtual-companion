import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MemoryType {
    FACT = 'fact',              // Factual information about user
    PREFERENCE = 'preference',  // User likes/dislikes
    EXPERIENCE = 'experience',  // Shared experiences
    EMOTION = 'emotion',        // Emotional moments
    GOAL = 'goal',              // User goals/aspirations
}

@Entity('memories')
export class Memory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 42 })
    userAddress!: string;

    @Column({ type: 'enum', enum: MemoryType })
    memoryType!: MemoryType;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    summary?: string; // Short summary for quick retrieval

    @Column({ type: 'float', default: 1.0 })
    importance!: number; // 0.0 to 1.0 (how important to remember)

    @Column({ type: 'int', default: 0 })
    accessCount!: number; // How many times recalled

    @Column({ type: 'uuid', nullable: true })
    conversationId?: string; // Source conversation

    @Column({ type: 'uuid', nullable: true })
    messageId?: string; // Source message

    @Column({ type: 'jsonb', nullable: true })
    embedding?: number[]; // Vector embedding for semantic search

    @Column({ type: 'text', nullable: true })
    encryptionKey?: string; // For encrypted memories

    @Column({ type: 'boolean', default: false })
    isEncrypted!: boolean;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastAccessedAt?: Date;
}
