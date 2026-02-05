import { useState, useCallback, useRef } from 'react';

export const useVoiceInteraction = (onTranscript: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition (STT)
    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
        };

        recognition.start();
        recognitionRef.current = recognition;
    }, [onTranscript]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    // Text to Speech (TTS)
    const speak = useCallback((text: string, voiceSettings?: { voice: string, language: string, pitch: number }) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceSettings?.language || 'en-US';
        utterance.pitch = voiceSettings?.pitch || 1.0;

        // Find specific voice if needed
        const voices = window.speechSynthesis.getVoices();
        if (voiceSettings?.voice) {
            const selectedVoice = voices.find(v => v.name.includes(voiceSettings.voice));
            if (selectedVoice) utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    return {
        isListening,
        isSpeaking,
        startListening,
        stopListening,
        speak
    };
};
