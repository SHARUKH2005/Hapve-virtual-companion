# Leon AI Integration for Alive Avatar

## Overview

This integration connects your alive avatar with Leon AI, providing intelligent voice interaction capabilities. Leon AI acts as the "brain" of your avatar, enabling it to understand natural language, respond intelligently, and perform various tasks through its skill system.

## Features

✨ **Voice Intelligence**: Leon AI processes user queries and generates intelligent responses
🎤 **Speech Recognition**: Real-time voice input using Web Speech API
🗣️ **Text-to-Speech**: Leon AI's TTS engine makes the avatar speak naturally
🧠 **Skill System**: Access to Leon's extensive skill library
💬 **Conversation History**: Track and display conversation flow
🔄 **Real-time Communication**: WebSocket-based instant messaging
📊 **Status Indicators**: Visual feedback for talking, listening, and processing states

## Architecture

```
┌─────────────────┐
│  User Interface │
│  (Frontend)     │
└────────┬────────┘
         │
         ├─── HeyGen Avatar Service (Visual Avatar)
         │
         ├─── Leon AI Service (Voice Intelligence)
         │    ├── Speech Recognition
         │    ├── Natural Language Processing
         │    ├── Text-to-Speech
         │    └── Skill Execution
         │
         └─── Backend API
              ├── Leon Controller
              ├── Leon Routes
              └── Leon Service
```

## Setup Instructions

### 1. Install Leon AI

First, you need to have Leon AI running on your system:

```bash
# Install Leon CLI
npm install --global @leon-ai/cli

# Create Leon instance
leon create birth

# Navigate to Leon directory
cd leon

# Start Leon AI server
leon start
```

Leon AI will run on `http://localhost:1337` by default.

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Leon AI Configuration
LEON_HOST=http://localhost
LEON_PORT=1337
LEON_API_KEY=your_api_key_here
LEON_LANGUAGE=en-US
```

### 3. Install Dependencies

The required dependencies should already be in your `package.json`:

**Frontend:**
```json
{
  "socket.io-client": "^4.7.5",
  "axios": "^1.6.2"
}
```

**Backend:**
```json
{
  "socket.io-client": "^4.7.5",
  "axios": "^1.6.2",
  "multer": "^1.4.5-lts.1"
}
```

### 4. Register Leon Routes

Add Leon routes to your main server file:

**backend/src/index.ts** or **backend/src/app.ts**:

```typescript
import leonRoutes from './routes/leon.routes';

// ... other imports and setup

app.use('/api/leon', leonRoutes);
```

### 5. Initialize Leon Service on Startup

**backend/src/index.ts**:

```typescript
import { getLeonBackendService } from './services/leon.service';

// After server starts
const leonService = getLeonBackendService();
leonService.connect().then(() => {
  console.log('✅ Leon AI connected');
}).catch((error) => {
  console.error('❌ Leon AI connection failed:', error);
});
```

## Usage

### Frontend Integration

#### Option 1: Use LeonLiveAvatar Component

```typescript
import { LeonLiveAvatar } from './components/LeonLiveAvatar';

function App() {
  return (
    <LeonLiveAvatar
      accessToken="your_heygen_token"
      avatarId="your_avatar_id"
      voiceId="your_voice_id"
      quality="high"
      leonConfig={{
        host: 'http://localhost',
        port: 1337,
        language: 'en-US'
      }}
      onReady={() => console.log('Avatar ready!')}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

#### Option 2: Use Leon AI Service Directly

```typescript
import { getLeonAI } from './services/leonAI';

const leon = getLeonAI({
  host: 'http://localhost',
  port: 1337,
  language: 'en-US'
});

// Connect to Leon
await leon.connect();

// Send query
const response = await leon.query('What is the weather today?');
console.log(response.speech); // Leon's response

// Get voice output
const audioUrl = await leon.getVoiceOutput('Hello, how are you?');
// Play audio...

// Disconnect
leon.disconnect();
```

### Backend API Endpoints

#### Initialize Leon AI
```http
POST /api/leon/initialize
```

#### Send Query
```http
POST /api/leon/query
Content-Type: application/json

{
  "text": "What is the weather today?",
  "userId": "user123"
}
```

#### Text-to-Speech
```http
POST /api/leon/tts
Content-Type: application/json

{
  "text": "Hello, this is Leon speaking"
}

Response: Audio file (WAV)
```

#### Speech-to-Text
```http
POST /api/leon/stt
Content-Type: multipart/form-data

audio: <audio file>

Response: { "success": true, "text": "transcribed text" }
```

#### Get Skills
```http
GET /api/leon/skills

Response: { "success": true, "skills": [...] }
```

#### Health Check
```http
GET /api/leon/health

Response: { 
  "success": true, 
  "status": { 
    "healthy": true, 
    "connected": true 
  } 
}
```

## Component Features

### LeonLiveAvatar Component

**Props:**
- `accessToken` (string): HeyGen API access token
- `avatarId` (string, optional): HeyGen avatar ID
- `voiceId` (string, optional): HeyGen voice ID
- `quality` ('low' | 'medium' | 'high'): Video quality
- `leonConfig` (object, optional): Leon AI configuration
- `onReady` (function, optional): Callback when avatar is ready
- `onError` (function, optional): Error callback

**Features:**
- Real-time video streaming of alive avatar
- Voice input via microphone
- Text input via chat interface
- Conversation history display
- Visual status indicators (talking, listening, processing)
- Leon AI connection status
- Error handling and display

## Leon AI Skills

Leon AI comes with many built-in skills. Some examples:

- **Productivity**: Calendar, reminders, to-do lists
- **Information**: Weather, news, Wikipedia
- **Entertainment**: Jokes, games, music
- **Utilities**: Calculator, unit converter, timer
- **Social**: Email, messaging
- **Custom Skills**: You can create your own!

## Customization

### Adding Custom Skills to Leon

1. Navigate to your Leon installation:
```bash
cd leon/skills
```

2. Create a new skill:
```bash
leon create:skill my-custom-skill
```

3. Edit the skill configuration and code

4. Train Leon with the new skill:
```bash
leon train
```

### Customizing Avatar Responses

You can modify the `LeonLiveAvatar` component to:
- Add custom response processing
- Implement emotion detection
- Add gesture controls
- Integrate with other AI services

## Troubleshooting

### Leon AI Not Connecting

1. **Check if Leon is running:**
```bash
# In Leon directory
leon start
```

2. **Verify the port:**
```bash
# Check if port 1337 is in use
netstat -an | grep 1337
```

3. **Check firewall settings:**
Ensure port 1337 is not blocked

### Speech Recognition Not Working

1. **Browser compatibility:**
   - Chrome/Edge: Full support
   - Firefox: Limited support
   - Safari: Partial support

2. **Microphone permissions:**
   - Check browser permissions
   - Ensure HTTPS (required for mic access)

### Avatar Not Speaking

1. **Check HeyGen token:**
   - Verify token is valid
   - Check token permissions

2. **Check Leon TTS:**
   - Test TTS endpoint directly
   - Verify audio codec support

## Performance Optimization

### Reduce Latency

1. **Use local Leon instance** (not remote)
2. **Enable Leon's offline mode** for faster responses
3. **Cache common responses**
4. **Use WebSocket** for real-time communication

### Optimize Avatar Quality

1. **Adjust quality setting** based on network
2. **Use adaptive bitrate** streaming
3. **Implement connection quality detection**

## Security Considerations

1. **API Key Protection:**
   - Never expose Leon API key in frontend
   - Use environment variables
   - Implement backend proxy

2. **Input Validation:**
   - Sanitize user input
   - Implement rate limiting
   - Add CORS protection

3. **Audio Data:**
   - Encrypt audio transmission
   - Implement secure storage
   - Add data retention policies

## Advanced Features

### Multi-Language Support

```typescript
const leon = getLeonAI({
  language: 'fr-FR' // French
});
```

Supported languages:
- English (en-US)
- French (fr-FR)
- Spanish (es-ES)
- German (de-DE)
- And more...

### Custom Voice Profiles

Integrate different TTS voices for different personalities:

```typescript
const avatarConfig = {
  personality: 'professional',
  voice: 'female-professional',
  language: 'en-US'
};
```

### Emotion Detection

Add emotion analysis to avatar responses:

```typescript
const response = await leon.query(text);
const emotion = detectEmotion(response.speech);
avatar.setEmotion(emotion);
```

## Resources

- [Leon AI Documentation](https://docs.getleon.ai)
- [Leon AI GitHub](https://github.com/leon-ai/leon)
- [HeyGen API Docs](https://docs.heygen.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## Support

For issues and questions:
- Leon AI: [Discord](https://discord.gg/MNQqqKg)
- This Project: Create an issue in the repository

## License

This integration follows the same license as your main project.
Leon AI is licensed under MIT License.
