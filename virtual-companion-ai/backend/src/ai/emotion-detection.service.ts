import { EmotionType } from '../db/entities/Message';

/**
 * Emotion Detection Service
 * Analyzes text to detect emotional cues and sentiment
 */
export class EmotionDetectionService {
    // Emotion keywords mapping
    private static readonly emotionKeywords = {
        [EmotionType.HAPPY]: [
            'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love',
            'excellent', 'fantastic', 'awesome', 'good', 'glad', 'pleased',
            'delighted', 'cheerful', 'thrilled', '😊', '😄', '😁', '🎉', '❤️'
        ],
        [EmotionType.SAD]: [
            'sad', 'unhappy', 'depressed', 'down', 'miserable', 'upset', 'disappointed',
            'hurt', 'lonely', 'crying', 'tears', 'heartbroken', 'grief', 'sorrow',
            'blue', 'gloomy', 'melancholy', '😢', '😭', '💔'
        ],
        [EmotionType.ANGRY]: [
            'angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'frustrated',
            'hate', 'pissed', 'outraged', 'aggravated', 'livid', 'enraged',
            'resentful', 'hostile', '😠', '😡', '🤬'
        ],
        [EmotionType.FEARFUL]: [
            'scared', 'afraid', 'fear', 'terrified', 'anxious', 'worried', 'nervous',
            'panic', 'frightened', 'alarmed', 'dread', 'concerned', 'uneasy',
            'apprehensive', 'tense', '😨', '😰', '😱'
        ],
        [EmotionType.SURPRISED]: [
            'surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'wow',
            'unexpected', 'unbelievable', 'incredible', 'startled', 'speechless',
            '😲', '😮', '🤯'
        ],
        [EmotionType.DISGUSTED]: [
            'disgusted', 'gross', 'awful', 'terrible', 'horrible', 'nasty',
            'revolting', 'repulsive', 'sick', 'yuck', '🤮', '🤢'
        ],
    };

    // Positive and negative sentiment words
    private static readonly positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
        'love', 'like', 'enjoy', 'appreciate', 'thank', 'perfect', 'beautiful',
        'brilliant', 'outstanding', 'superb', 'magnificent'
    ];

    private static readonly negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'worse',
        'worst', 'poor', 'disappointing', 'frustrating', 'annoying', 'useless',
        'wrong', 'fail', 'failed', 'problem', 'issue', 'difficult'
    ];

    // Intensifiers
    private static readonly intensifiers = [
        'very', 'extremely', 'really', 'so', 'too', 'incredibly', 'absolutely',
        'completely', 'totally', 'utterly', 'highly'
    ];

    /**
     * Detect emotion from text
     * @param text - Input text
     * @returns Detected emotion and confidence score
     */
    static detectEmotion(text: string): {
        emotion: EmotionType;
        confidence: number;
    } {
        const lowerText = text.toLowerCase();
        const scores: Record<EmotionType, number> = {
            [EmotionType.NEUTRAL]: 0,
            [EmotionType.HAPPY]: 0,
            [EmotionType.SAD]: 0,
            [EmotionType.ANGRY]: 0,
            [EmotionType.FEARFUL]: 0,
            [EmotionType.SURPRISED]: 0,
            [EmotionType.DISGUSTED]: 0,
        };

        // Count emotion keywords
        Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) {
                    // Check for intensifiers
                    const hasIntensifier = this.intensifiers.some(intensifier =>
                        lowerText.includes(`${intensifier} ${keyword}`)
                    );
                    scores[emotion as EmotionType] += matches.length * (hasIntensifier ? 1.5 : 1);
                }
            });
        });

        // Check for exclamation marks (indicates strong emotion)
        const exclamationCount = (text.match(/!/g) || []).length;
        if (exclamationCount > 0) {
            // Boost all non-neutral emotions slightly
            Object.keys(scores).forEach(emotion => {
                if (emotion !== EmotionType.NEUTRAL) {
                    scores[emotion as EmotionType] += exclamationCount * 0.2;
                }
            });
        }

        // Check for question marks (might indicate uncertainty/fear)
        const questionCount = (text.match(/\?/g) || []).length;
        if (questionCount > 2) {
            scores[EmotionType.FEARFUL] += questionCount * 0.1;
        }

        // Find dominant emotion
        let maxScore = 0;
        let dominantEmotion = EmotionType.NEUTRAL;

        Object.entries(scores).forEach(([emotion, score]) => {
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emotion as EmotionType;
            }
        });

        // Calculate confidence (normalize to 0-1)
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0;

        // If no strong emotion detected, return neutral
        if (maxScore < 0.5) {
            return { emotion: EmotionType.NEUTRAL, confidence: 0.5 };
        }

        return {
            emotion: dominantEmotion,
            confidence: Math.max(confidence, 0.3), // Minimum confidence
        };
    }

    /**
     * Calculate sentiment score (-1 to 1)
     * @param text - Input text
     * @returns Sentiment score
     */
    static analyzeSentiment(text: string): number {
        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        // Count positive words
        this.positiveWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                const hasIntensifier = this.intensifiers.some(intensifier =>
                    lowerText.includes(`${intensifier} ${word}`)
                );
                positiveCount += matches.length * (hasIntensifier ? 1.5 : 1);
            }
        });

        // Count negative words
        this.negativeWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                const hasIntensifier = this.intensifiers.some(intensifier =>
                    lowerText.includes(`${intensifier} ${word}`)
                );
                negativeCount += matches.length * (hasIntensifier ? 1.5 : 1);
            }
        });

        // Handle negation (not good = negative)
        const negationPattern = /\b(not|no|never|don't|doesn't|didn't|won't|can't)\s+(\w+)/gi;
        let match;
        while ((match = negationPattern.exec(lowerText)) !== null) {
            const word = match[2];
            if (this.positiveWords.includes(word)) {
                positiveCount -= 1;
                negativeCount += 1;
            } else if (this.negativeWords.includes(word)) {
                negativeCount -= 1;
                positiveCount += 1;
            }
        }

        // Calculate sentiment (-1 to 1)
        const total = positiveCount + negativeCount;
        if (total === 0) return 0;

        const score = (positiveCount - negativeCount) / total;
        return Math.max(-1, Math.min(1, score));
    }

    /**
     * Analyze text comprehensively
     * @param text - Input text
     * @returns Emotion, confidence, and sentiment
     */
    static analyzeText(text: string): {
        emotion: EmotionType;
        emotionConfidence: number;
        sentimentScore: number;
    } {
        const { emotion, confidence } = this.detectEmotion(text);
        const sentimentScore = this.analyzeSentiment(text);

        return {
            emotion,
            emotionConfidence: confidence,
            sentimentScore,
        };
    }

    /**
     * Get emotional response tone based on detected emotion
     * @param emotion - Detected emotion
     * @returns Suggested response tone
     */
    static getResponseTone(emotion: EmotionType): string {
        const tones: Record<EmotionType, string> = {
            [EmotionType.HAPPY]: 'Share their joy and be enthusiastic',
            [EmotionType.SAD]: 'Show empathy and offer comfort',
            [EmotionType.ANGRY]: 'Stay calm and acknowledge their feelings',
            [EmotionType.FEARFUL]: 'Provide reassurance and support',
            [EmotionType.SURPRISED]: 'Match their energy and be engaging',
            [EmotionType.DISGUSTED]: 'Acknowledge their discomfort and be understanding',
            [EmotionType.NEUTRAL]: 'Maintain a balanced, helpful tone',
        };

        return tones[emotion];
    }
}
