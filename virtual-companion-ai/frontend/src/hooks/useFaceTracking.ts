import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

export interface FaceExpression {
    smile: number;      // 0 to 1
    mouthOpen: number;  // 0 to 1
    eyeBlinkLeft: number; // 0 to 1 (1 is closed)
    eyeBlinkRight: number; // 0 to 1
    headRotation: { x: number; y: number; z: number };
}

export const useFaceTracking = (videoRef: React.RefObject<HTMLVideoElement>) => {
    // Use Ref for high-performance reading in animation loops (avoid re-renders)
    const expressionRef = useRef<FaceExpression>({
        smile: 0,
        mouthOpen: 0,
        eyeBlinkLeft: 0,
        eyeBlinkRight: 0,
        headRotation: { x: 0, y: 0, z: 0 }
    });

    const [isTracking, setIsTracking] = useState(false);
    const faceMeshRef = useRef<FaceMesh | null>(null);

    useEffect(() => {
        console.log('[FaceTracking] Hook mounted, videoRef:', videoRef.current);

        if (!videoRef.current) {
            console.warn('[FaceTracking] No video element ref provided');
            return;
        }

        console.log('[FaceTracking] Initializing MediaPipe FaceMesh...');
        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                console.log('[FaceTracking] Loading MediaPipe file:', url);
                return url;
            },
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        console.log('[FaceTracking] FaceMesh options set');

        faceMesh.onResults((results) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const expr = computeExpressions(landmarks);

                // Update Ref directly
                expressionRef.current = expr;

                if (!isTracking) {
                    console.log('[FaceTracking] ✅ Face detected! Tracking started.');
                    setIsTracking(true);
                }
            } else {
                if (isTracking) {
                    console.log('[FaceTracking] ⚠️ Face lost');
                    setIsTracking(false);
                }
            }
        });

        faceMeshRef.current = faceMesh;

        if (videoRef.current) {
            console.log('[FaceTracking] Starting camera...');
            const camera = new cam.Camera(videoRef.current, {
                onFrame: async () => {
                    if (faceMeshRef.current && videoRef.current) {
                        try {
                            await faceMeshRef.current.send({ image: videoRef.current });
                        } catch (e) {
                            console.error('[FaceTracking] Frame processing error:', e);
                        }
                    }
                },
                width: 640,
                height: 480,
            });

            camera.start().then(() => {
                console.log('[FaceTracking] 📹 Camera started successfully!');
            }).catch((err) => {
                console.error('[FaceTracking] ❌ Camera start failed:', err);
            });
        }

        return () => {
            console.log('[FaceTracking] Cleaning up...');
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, []); // Run once on mount

    return { expressionRef, isTracking };
};

// Helper: Compute simple expressions from landmarks
function computeExpressions(landmarks: any[]): FaceExpression {
    // MediaPipe Facemesh Keypoints (Approximate)
    // 13: Upper Lip, 14: Lower Lip
    // 61, 291: Mouth Corners (Left, Right)
    // 159, 145: Left Eye (Top, Bottom)
    // 386, 374: Right Eye (Top, Bottom)

    // 1. Smile (Mouth Width / Face Width ratio approx)
    const left = landmarks[61];
    const right = landmarks[291];
    const top = landmarks[13];
    const bottom = landmarks[14];

    const mouthWidth = Math.hypot(left.x - right.x, left.y - right.y);
    const mouthHeight = Math.hypot(top.x - bottom.x, top.y - bottom.y);

    // Heuristic: Smile widens mouth.
    // Normalized by face width would be better but simple heuristic for now:
    const smileRaw = (mouthWidth * 5.0) - 0.5; // Tuning needed
    const smile = Math.max(0, Math.min(1, smileRaw));

    // 2. Mouth Open
    const mouthOpenRaw = (mouthHeight * 10.0) - 0.1;
    const mouthOpen = Math.max(0, Math.min(1, mouthOpenRaw));

    // 3. Eye Blinks (Height / Width ratio)
    // Left Eye
    const lTop = landmarks[159];
    const lBot = landmarks[145];
    const lLeft = landmarks[33];
    const lRight = landmarks[133];
    const lH = Math.hypot(lTop.x - lBot.x, lTop.y - lBot.y);
    const lW = Math.hypot(lLeft.x - lRight.x, lLeft.y - lRight.y);
    const blinkLeft = lH / lW < 0.15 ? 1 : 0; // Simple threshold

    // Right Eye
    const rTop = landmarks[386];
    const rBot = landmarks[374];
    const rLeft = landmarks[362];
    const rRight = landmarks[263];
    const rH = Math.hypot(rTop.x - rBot.x, rTop.y - rBot.y);
    const rW = Math.hypot(rLeft.x - rRight.x, rLeft.y - rRight.y);
    const blinkRight = rH / rW < 0.15 ? 1 : 0;

    return {
        smile,
        mouthOpen,
        eyeBlinkLeft: blinkLeft,
        eyeBlinkRight: blinkRight,
        headRotation: { x: 0, y: 0, z: 0 } // Todo: SolvePnP for rotation
    };
}
