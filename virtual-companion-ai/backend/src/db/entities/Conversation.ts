import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Identity } from './Identity';
import { Message } from './Message';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Identity)
    user!: Identity;

    @Column({ type: 'varchar', length: 42 })
    userAddress!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title?: string;

    @Column({ type: 'uuid', nullable: true })
    personaId?: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @OneToMany(() => Message, message => message.conversation)
    messages!: Message[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastMessageAt?: Date;
}
