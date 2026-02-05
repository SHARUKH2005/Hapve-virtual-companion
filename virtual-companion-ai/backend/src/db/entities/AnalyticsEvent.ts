import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AnalyticsEventType {
    SESSION_START = 'session_start',
    MESSAGE_SENT = 'message_sent',
    VOICE_USED = 'voice_used',
    MEMORY_RECALLED = 'memory_recalled',
    NFT_MINTED = 'nft_minted',
    COMPANION_UPGRADED = 'companion_upgraded',
    SKILL_PURCHASED = 'skill_purchased',
    WELLNESS_CHECK = 'wellness_check',
}

@Entity('analytics_events')
export class AnalyticsEvent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 42 })
    @Index()
    userAddressAnonymized!: string; // Hashed or stored as is (since wallet is public)

    @Column({ type: 'enum', enum: AnalyticsEventType })
    @Index()
    eventType!: AnalyticsEventType;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: any;

    @CreateDateColumn()
    @Index()
    createdAt!: Date;
}
