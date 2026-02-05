import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PersonalityType {
    FRIENDLY = 'friendly',
    PROFESSIONAL = 'professional',
    MENTOR = 'mentor',
    CALM = 'calm',
    PLAYFUL = 'playful',
    EMPATHETIC = 'empathetic',
    ANALYTICAL = 'analytical',
}

@Entity('personas')
export class Persona {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'enum', enum: PersonalityType })
    personalityType!: PersonalityType;

    @Column({ type: 'text' })
    systemPrompt!: string; // Base instructions for AI behavior

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'jsonb' })
    config!: {
        temperature: number;        // 0.0 to 1.0 (creativity)
        maxTokens: number;          // Response length
        topP: number;               // Token diversity
        frequencyPenalty: number;   // Avoid repetition
        presencePenalty: number;    // Topic diversity
        emotionalResponsiveness: number; // 0 to 1 (how much emotion affects response)
    };

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'boolean', default: false })
    isDefault!: boolean;

    @Column({ type: 'varchar', length: 42, nullable: true })
    createdBy?: string; // User address if custom persona

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
