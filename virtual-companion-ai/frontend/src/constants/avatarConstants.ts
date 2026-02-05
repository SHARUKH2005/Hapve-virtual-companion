// Facial Expressions from talking-avatar-with-ai
// Used for morphing the 3D avatar's face

export const facialExpressions: Record<string, Record<string, number>> = {
    default: {},
    smile: {
        browInnerUp: 0.17,
        eyeSquintLeft: 0.4,
        eyeSquintRight: 0.44,
        noseSneerLeft: 0.17,
        noseSneerRight: 0.14,
        mouthPressLeft: 0.61,
        mouthPressRight: 0.41,
    },
    funnyFace: {
        jawLeft: 0.63,
        mouthPucker: 0.53,
        noseSneerLeft: 1,
        noseSneerRight: 0.39,
        mouthLeft: 1,
        eyeLookUpLeft: 1,
        eyeLookUpRight: 1,
        cheekPuff: 0.99,
        mouthDimpleLeft: 0.41,
        mouthRollLower: 0.32,
        mouthSmileLeft: 0.35,
        mouthSmileRight: 0.35,
    },
    sad: {
        mouthFrownLeft: 1,
        mouthFrownRight: 1,
        mouthShrugLower: 0.78,
        browInnerUp: 0.45,
        eyeSquintLeft: 0.72,
        eyeSquintRight: 0.75,
        eyeLookDownLeft: 0.5,
        eyeLookDownRight: 0.5,
        jawForward: 1,
    },
    surprised: {
        eyeWideLeft: 0.5,
        eyeWideRight: 0.5,
        jawOpen: 0,
        mouthFunnel: 0.2,
        browInnerUp: 1,
    },
    angry: {
        browDownLeft: 1,
        browDownRight: 1,
        eyeSquintLeft: 1,
        eyeSquintRight: 1,
        jawForward: 1,
        jawLeft: 1,
        mouthShrugLower: 1,
        noseSneerLeft: 1,
        noseSneerRight: 0.42,
        eyeLookDownLeft: 0.16,
        eyeLookDownRight: 0.16,
        cheekSquintLeft: 1,
        cheekSquintRight: 1,
        mouthClose: 0.23,
        mouthFunnel: 0.63,
        mouthDimpleRight: 1,
    },
    crazy: {
        browInnerUp: 0.9,
        jawForward: 1,
        noseSneerLeft: 0.57,
        noseSneerRight: 0.51,
        eyeLookDownLeft: 0.39,
        eyeLookUpRight: 0.40,
        eyeLookInLeft: 0.96,
        eyeLookInRight: 0.96,
        jawOpen: 0.96,
        mouthDimpleLeft: 0.96,
        mouthDimpleRight: 0.96,
        mouthStretchLeft: 0.28,
        mouthStretchRight: 0.29,
        mouthSmileLeft: 0.56,
        mouthSmileRight: 0.38,
        tongueOut: 0.96,
    },
    thinking: {
        browInnerUp: 0.2,
        eyeSquintLeft: 0.1,
        eyeSquintRight: 0.1,
        eyeLookUpLeft: 0.3,
        eyeLookUpRight: 0.3,
        mouthPucker: 0.2,
    },
    concerned: {
        browInnerUp: 0.4,
        mouthFrownLeft: 0.4,
        mouthFrownRight: 0.4,
        eyeSquintLeft: 0.3,
        eyeSquintRight: 0.3,
    },
    happy: {
        browInnerUp: 0.17,
        eyeSquintLeft: 0.4,
        eyeSquintRight: 0.44,
        mouthSmileLeft: 0.8,
        mouthSmileRight: 0.8,
        cheekSquintLeft: 0.3,
        cheekSquintRight: 0.3,
    },
    neutral: {},
};

// Viseme mapping from Rhubarb lip sync
export const visemesMapping: Record<string, string> = {
    A: "viseme_PP",
    B: "viseme_kk",
    C: "viseme_I",
    D: "viseme_AA",
    E: "viseme_O",
    F: "viseme_U",
    G: "viseme_FF",
    H: "viseme_TH",
    X: "viseme_PP",
};

// All morph targets available on Ready Player Me avatars
export const morphTargets = [
    "browDownLeft",
    "browDownRight",
    "browInnerUp",
    "browOuterUpLeft",
    "browOuterUpRight",
    "cheekPuff",
    "cheekSquintLeft",
    "cheekSquintRight",
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
    "eyeSquintLeft",
    "eyeSquintRight",
    "eyeWideLeft",
    "eyeWideRight",
    "jawForward",
    "jawLeft",
    "jawOpen",
    "jawRight",
    "mouthClose",
    "mouthDimpleLeft",
    "mouthDimpleRight",
    "mouthFrownLeft",
    "mouthFrownRight",
    "mouthFunnel",
    "mouthLeft",
    "mouthLowerDownLeft",
    "mouthLowerDownRight",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthPucker",
    "mouthRight",
    "mouthRollLower",
    "mouthRollUpper",
    "mouthShrugLower",
    "mouthShrugUpper",
    "mouthSmileLeft",
    "mouthSmileRight",
    "mouthStretchLeft",
    "mouthStretchRight",
    "mouthUpperUpLeft",
    "mouthUpperUpRight",
    "noseSneerLeft",
    "noseSneerRight",
    "tongueOut",
    // Viseme targets
    "viseme_PP",
    "viseme_kk",
    "viseme_I",
    "viseme_AA",
    "viseme_O",
    "viseme_U",
    "viseme_FF",
    "viseme_TH",
    "viseme_DD",
    "viseme_SS",
    "viseme_nn",
    "viseme_RR",
    "viseme_CH",
    "viseme_sil",
];

// Animation names available in the avatar model
export const animations = [
    "Idle",
    "TalkingOne",
    "TalkingTwo",
    "TalkingThree",
    "SadIdle",
    "Defeated",
    "Angry",
    "Surprised",
    "DismissingGesture",
    "ThoughtfulHeadShake",
    "HappyIdle",
];

// Map emotion to animation and expression
export function getAnimationFromEmotion(emotion: string): { animation: string; facialExpression: string } {
    switch (emotion) {
        case 'happy':
            return { animation: 'HappyIdle', facialExpression: 'smile' };
        case 'sad':
            return { animation: 'SadIdle', facialExpression: 'sad' };
        case 'angry':
            return { animation: 'Angry', facialExpression: 'angry' };
        case 'surprised':
            return { animation: 'Surprised', facialExpression: 'surprised' };
        case 'thinking':
            return { animation: 'ThoughtfulHeadShake', facialExpression: 'thinking' };
        case 'concerned':
            return { animation: 'SadIdle', facialExpression: 'concerned' };
        default:
            return { animation: 'Idle', facialExpression: 'default' };
    }
}

export default {
    facialExpressions,
    visemesMapping,
    morphTargets,
    animations,
    getAnimationFromEmotion,
};
