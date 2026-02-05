import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Identity } from './Identity';

@Entity('companions')
export class Companion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'integer', nullable: true })
    tokenId?: number; // The NFT Token ID on-chain

    @Column({ type: 'varchar', length: 42 })
    ownerAddress!: string;

    @OneToOne(() => Identity)
    @JoinColumn()
    identity!: Identity;

    // Leveling & Progression stats
    @Column({ type: 'integer', default: 1 })
    level!: number;

    @Column({ type: 'integer', default: 0 })
    experience!: number;

    @Column({ type: 'integer', default: 0 })
    totalMessages!: number;

    // Visuals & Metadata
    @Column({ type: 'text', nullable: true })
    avatarUrl?: string;

    @Column({ type: 'jsonb', default: {} })
    traits!: Record<string, any>; // Dynamic traits like 'Maturity', 'Empathy Level'

    // Customization Settings (Step 8)
    @Column({ type: 'varchar', length: 50, default: 'friendly' })
    personality!: string; // friendly, mentor, professional, calm

    @Column({ type: 'varchar', length: 50, default: 'empathetic' })
    responseStyle!: string; // short, detailed, empathetic

    @Column({
        type: 'jsonb', default: {
            voice: 'neutral',
            language: 'en-US',
            pitch: 1.0,
            style: 'conversational'
        }
    })
    customSettings!: {
        voice: string;
        language: string;
        pitch: number;
        style: string;
    };

    // Wellness & Mood Tracking (Step 9)
    @Column({ type: 'float', default: 1.0 })
    wellnessScore!: number; // 0.0 to 1.0 overall mental health index

    @Column({ type: 'jsonb', default: [] })
    moodHistory!: Array<{
        mood: string;
        score: number;
        timestamp: string;
    }>;

    @Column({ type: 'text', nullable: true })
    metadataUri?: string; // IPFS or local link to current JSON metadata

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastInteractionAt?: Date;
}
