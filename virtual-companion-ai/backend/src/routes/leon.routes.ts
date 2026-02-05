import { Router } from 'express';
import multer from 'multer';
import leonController from '../controllers/leon.controller';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

/**
 * @route   POST /api/leon/initialize
 * @desc    Initialize Leon AI connection
 * @access  Public
 */
router.post('/initialize', leonController.initialize.bind(leonController));

/**
 * @route   POST /api/leon/query
 * @desc    Send text query to Leon AI
 * @access  Public
 * @body    { text: string, userId?: string }
 */
router.post('/query', leonController.query.bind(leonController));

/**
 * @route   POST /api/leon/tts
 * @desc    Convert text to speech using Leon AI
 * @access  Public
 * @body    { text: string }
 * @returns Audio file (WAV)
 */
router.post('/tts', leonController.textToSpeech.bind(leonController));

/**
 * @route   POST /api/leon/stt
 * @desc    Convert speech to text using Leon AI
 * @access  Public
 * @body    FormData with audio file
 * @returns { success: boolean, text: string }
 */
router.post('/stt', upload.single('audio'), leonController.speechToText.bind(leonController));

/**
 * @route   GET /api/leon/skills
 * @desc    Get available Leon AI skills
 * @access  Public
 */
router.get('/skills', leonController.getSkills.bind(leonController));

/**
 * @route   GET /api/leon/health
 * @desc    Check Leon AI health status
 * @access  Public
 */
router.get('/health', leonController.healthCheck.bind(leonController));

/**
 * @route   GET /api/leon/status
 * @desc    Get Leon AI connection status
 * @access  Public
 */
router.get('/status', leonController.getStatus.bind(leonController));

export default router;
