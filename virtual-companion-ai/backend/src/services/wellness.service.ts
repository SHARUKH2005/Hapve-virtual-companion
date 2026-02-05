import { EmotionType } from '../db/entities/Message';

/**
 * Wellness Service
 * Handles mood tracking, empathy logic, and crisis detection
 */
export class WellnessService {

    private static readonly CRISIS_KEYWORDS = [
        'suicide', 'self-harm', 'kill myself', 'end my life',
        'hurting myself', 'don\'t want to live', 'hopeless'
    ];

    /**
     * Detects if the user is in a crisis state
     * @param text User input
     * @returns boolean
     */
    static isCrisis(text: string): boolean {
        const lowerText = text.toLowerCase();
        return this.CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Returns a supportive crisis response with resources
     */
    static getCrisisResponse(): string {
        return "I hear how much pain you're in, and I want you to know you're not alone. I'm an AI and can't provide professional care, but please consider reaching out to people who can help. You can call or text 988 in the US/Canada, or 111 in the UK, to speak with someone who cares. Your life has value.";
    }

    /**
     * Aggregates mood score from detected emotion
     */
    static getMoodScore(emotion: EmotionType): number {
        const scores: Record<EmotionType, number> = {
            [EmotionType.HAPPY]: 1.0,
            [EmotionType.SURPRISED]: 0.8,
            [EmotionType.NEUTRAL]: 0.5,
            [EmotionType.DISGUSTED]: 0.3,
            [EmotionType.FEARFUL]: 0.2,
            [EmotionType.ANGRY]: 0.1,
            [EmotionType.SAD]: 0.0
        };
        return scores[emotion] || 0.5;
    }

    /**
     * Generates a daily wellness check-in question
     */
    static getDailyCheckIn(): string {
        const questions = [
            "How are you feeling today, truly?",
            "Have you taken a moment for yourself today?",
            "What's one thing that made you smile recently?",
            "How is your heart feeling today?"
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    /**
     * Wraps responses with empathetic framing if mood is low
     */
    static wrapWithEmpathy(response: string, userMood: EmotionType): string {
        if (userMood === EmotionType.SAD || userMood === EmotionType.FEARFUL) {
            return `I can feel that you're going through a lot right now. ${response}`;
        }
        return response;
    }
}
