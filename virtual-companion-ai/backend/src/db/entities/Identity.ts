import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('identities')
export class Identity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 42, unique: true })
    walletAddress!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    did!: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'text', nullable: true })
    metadataHash?: string;

    @Column({ type: 'jsonb', default: { memoryConsent: true, temporarySession: false, sensitiveFilter: true, encryptionLevel: 'high' } })
    privacySettings!: {
        memoryConsent: boolean;    // Global toggle for AI learning
        temporarySession: boolean; // If true, nothing is saved after chat ends
        sensitiveFilter: boolean;  // Automatically omit sensitive topics from memory
        encryptionLevel: string;   // 'standard' or 'high'
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt?: Date;
}
