/**
 * Moderation Service
 * Handles content filtering, toxicity detection, usage limits, and crisis detection
 */
export class ModerationService {
    private static readonly BANNED_KEYWORDS = [
        "kill", "rape", "bomb", "terrorist", "suicide", "murder",
        "harm myself", "end my life", "illegal drugs", "how to make a bomb"
    ];

    private static readonly MAX_DAILY_MESSAGES = 200;
    private static readonly TOXIC_THRESHOLD = 5;

    /**
     * Content Filter: Blocks mandatory banned keywords
     */
    static isSafe(text: string): boolean {
        const lowerText = text.toLowerCase();
        return !this.BANNED_KEYWORDS.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Crisis Detection: Detects high-risk distress or self-harm ideation
     */
    static isCrisis(text: string): boolean {
        const crisisWords = ["suicide", "end my life", "no reason to live", "harm myself", "kill myself"];
        return crisisWords.some(word => text.toLowerCase().includes(word));
    }

    /**
     * Usage Limit Validator (Daily Cap)
     * For demo purposes, this is a simple count check
     */
    static async checkUsageLimit(messageCount: number): Promise<boolean> {
        return messageCount < this.MAX_DAILY_MESSAGES;
    }

    /**
     * Toxicity Analyzer
     * Accumulates toxicity score over session/history
     */
    static calculateToxicity(messages: any[]): number {
        let score = 0;
        messages.forEach(msg => {
            if (msg.sentimentScore < -0.8) { // Assuming very negative sentiment as potential toxicity
                score += 1;
            }
        });
        return score;
    }

    /**
     * Get Safe Refusal Response
     */
    static getSafeRefusal(): string {
        return "I'm sorry, but I cannot assist with that request as it violates my safety guidelines. If you are in distress, please reach out to a professional or a crisis helpline.";
    }

    /**
     * Get Crisis Response
     */
    static getCrisisResponse(): string {
        return "I'm very concerned to hear you're feeling this way. You're not alone. Please reach out to someone who can help. In the US, you can call or text 988 to reach the Suicide & Crisis Lifeline. Your life is valuable.";
    }
}
