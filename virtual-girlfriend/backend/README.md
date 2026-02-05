# Virtual Girlfriend Backend

This is the backend service for the Virtual Girlfriend application. It handles chat interactions, audio generation, and lip-syncing for the virtual avatar.

## Features

- **Chat Integration**: Uses OpenAI's GPT-3.5-turbo for generating conversational responses.
- **Text-to-Speech**: Converts text responses into audio using the ElevenLabs API.
- **Lip-Syncing**: Generates lip-sync data for the avatar using Rhubarb Lip Sync.
- **Facial Expressions and Animations**: Supports dynamic facial expressions and animations for the avatar.

## Prerequisites

- Node.js (v16 or higher)
- API keys for:
  - OpenAI
  - ElevenLabs
- Ensure `ffmpeg` and `rhubarb` are installed and available in your system's PATH.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/virtual-girlfriend.git
   cd virtual-girlfriend/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add the following:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
   ```

## Usage

### Start the backend server:
   ```bash
   npm run dev
   ```
The server will run on `http://localhost:3000`.

## API Endpoints

### `GET /`
Returns a simple "Hello World!" message.

### `GET /voices`
Fetches available voices from the ElevenLabs API.

### `POST /chat`
Handles chat requests. Accepts a JSON payload:
```json
{
  "message": "Hello!",
  "user_id": "12345"
}
```

Returns a JSON response with text, audio, lip-sync data, facial expressions, and animations.

## Development
Use `nodemon` for hot-reloading during development:
   ```bash
   npm install -g nodemon
   nodemon index.js
   ```

## License
This project is licensed under the MIT License.

