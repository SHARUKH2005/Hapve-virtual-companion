import { AppDataSource } from '../config/database';
import { AnalyticsEvent, AnalyticsEventType } from '../db/entities/AnalyticsEvent';
import { Message } from '../db/entities/Message';

/**
 * Analytics Service
 * Handles event logging and privacy-preserving metric calculations
 */
export class AnalyticsService {
    /**
     * Log an anonymized interaction event
     */
    static async logEvent(
        userAddress: string,
        eventType: AnalyticsEventType,
        metadata?: any
    ): Promise<void> {
        try {
            const analyticsRepo = AppDataSource.getRepository(AnalyticsEvent);
            const event = analyticsRepo.create({
                userAddressAnonymized: userAddress.toLowerCase(),
                eventType,
                metadata
            });
            await analyticsRepo.save(event);
        } catch (error) {
            console.error('Failed to log analytics event:', error);
        }
    }

    /**
     * Get Aggregated Growth Metrics (for dashboards)
     */
    static async getGrowthMetrics() {
        const analyticsRepo = AppDataSource.getRepository(AnalyticsEvent);

        // 1. Calculate Active Users (DAU)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dauResult = await analyticsRepo
            .createQueryBuilder('event')
            .select('COUNT(DISTINCT event.userAddressAnonymized)', 'count')
            .where('event.createdAt >= :today', { today })
            .getRawOne();

        // 2. Fetch Total Interactions
        const totalInteractions = await analyticsRepo.count();

        // 3. Companion Engagement Score Calculation
        // Formula: (Chats * 0.3) + (Voice * 0.3) + (Upgrades * 0.4)
        const counts = await analyticsRepo
            .createQueryBuilder('event')
            .select('event.eventType', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.eventType')
            .getRawMany();

        const typeMap = Object.fromEntries(counts.map(c => [c.type, parseInt(c.count)]));

        const engagementScore = (
            (typeMap[AnalyticsEventType.MESSAGE_SENT] || 0) * 0.3 +
            (typeMap[AnalyticsEventType.VOICE_USED] || 0) * 0.3 +
            (typeMap[AnalyticsEventType.COMPANION_UPGRADED] || 0) * 0.4
        ).toFixed(2);

        return {
            dau: parseInt(dauResult.count),
            totalInteractions,
            engagementScore,
            eventBreakdown: typeMap
        };
    }
}
