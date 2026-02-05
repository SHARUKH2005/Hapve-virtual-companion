import { Router } from 'express';
import { AuthController } from '../auth/auth.controller';
import { ChatController } from '../controllers/chat.controller';
import { PersonaController } from '../controllers/persona.controller';
import { MemoryController } from '../controllers/memory.controller';
import { PrivacyController } from '../controllers/privacy.controller';
import { CompanionController } from '../controllers/companion.controller';
import { TokenController } from '../controllers/token.controller';
import { authMiddleware } from '../auth/auth.middleware';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Authentication Routes ---
router.get('/auth/nonce', AuthController.getNonce);
router.post('/auth/verify', AuthController.verify);
router.post('/auth/logout', authMiddleware, AuthController.logout);
router.get('/auth/session', authMiddleware, AuthController.getSession);

// --- Chat & Interaction Routes ---
router.post('/chat/message', authMiddleware, ChatController.sendMessage);
router.get('/chat/history/:conversationId', authMiddleware, ChatController.getHistory);
router.get('/chat/conversations', authMiddleware, ChatController.getConversations);

// --- Persona Routes ---
router.get('/personas', authMiddleware, PersonaController.getAll);
router.post('/personas/initialize', PersonaController.initializeDefaults);

// --- Memory Management Routes ---
router.get('/memories', authMiddleware, MemoryController.getUserMemories);
router.patch('/memories/:id', authMiddleware, MemoryController.updateMemory);
router.delete('/memories/:id', authMiddleware, MemoryController.deleteMemory);

// --- Privacy & Data Ownership Routes ---
router.get('/privacy/settings', authMiddleware, PrivacyController.getSettings);
router.patch('/privacy/settings', authMiddleware, PrivacyController.updateSettings);
router.get('/privacy/export', authMiddleware, PrivacyController.exportData);
router.delete('/privacy/purge', authMiddleware, PrivacyController.purgeData);

// --- Companion NFT & Ownership Routes ---
router.get('/companion/status', authMiddleware, CompanionController.getStatus);
router.post('/companion/mint', authMiddleware, CompanionController.mint);
router.patch('/companion/customization', authMiddleware, CompanionController.updateCustomization);
router.post('/companion/generate-avatar', authMiddleware, upload.single('image'), CompanionController.generateAvatar);

// --- Token Economy Routes (Step 7) ---
router.get('/tokens/balance', authMiddleware, TokenController.getBalance);
router.post('/tokens/claim', authMiddleware, TokenController.claimDaily);

export default router;
