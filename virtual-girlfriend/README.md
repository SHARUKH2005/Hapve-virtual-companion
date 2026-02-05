# Avatar Chatbot Setup

## Table of Contents
1. [Overview](#overview)
2. [Virtual Girlfriend Frontend](#virtual-girlfriend-frontend)
   - [Features](#features)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Usage](#usage)
   - [Available Scripts](#available-scripts)
3. [Virtual Girlfriend Backend](#virtual-girlfriend-backend)
   - [Features](#features-1)
   - [Prerequisites](#prerequisites-1)
   - [Installation](#installation-1)
   - [Usage](#usage-1)
   - [API Endpoints](#api-endpoints)
   - [Development](#development)
4. [References](#references)
5. [License](#license)

## Overview

Experience the future of companionship with an AI-powered 3D virtual chatbot. Engage in lifelike conversations, enjoy emotional interactions, and immerse yourself in a hyper-realistic experience. With stunning visuals, adaptive intelligence, and a natural voice, your virtual companion is just a chat away! 💕

## Virtual Girlfriend Frontend
![Screenshot 2025-03-30 204238](https://github.com/user-attachments/assets/f055df15-a9d2-4ab8-9cd5-c773b6125cce)

This is the frontend service for the Virtual Girlfriend application. It provides a user interface for interacting with the virtual avatar, supporting real-time chat, audio playback, and lip-sync animations.

### Features

- **Chat Interface**: Allows users to send and receive messages.
- **Audio Playback**: Plays generated speech from the backend.
- **Lip-Syncing**: Displays avatar animations based on audio responses.
- **Facial Expressions and Animations**: Enhances interactivity with dynamic visuals.

### Prerequisites

- Node.js (v16 or higher)
- React.js (latest version)
- A running instance of the Virtual Girlfriend backend

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/satyamshorrf/virtual-girlfriend.git
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the frontend directory and add the backend API URL:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:3000
   ```

### Usage

#### Start the frontend server:
   ```bash
   npm start
   ```
The frontend will run on `http://localhost:5173` (or another port if specified).

### Available Scripts

#### `npm start`
Runs the app in development mode.

#### `npm run build`
Builds the app for production.

#### `npm test`
Runs the test suite.

## Virtual Girlfriend Backend
![Screenshot 2025-03-30 170652](https://github.com/user-attachments/assets/78fb1a1a-7da4-49af-9ba8-c847317b3db9)

This is the backend service for the Virtual Girlfriend application. It handles chat interactions, audio generation, and lip-syncing for the virtual avatar.

### Features

- **Chat Integration**: Uses OpenAI's GPT-3.5-turbo for generating conversational responses.
- **Text-to-Speech**: Converts text responses into audio using the ElevenLabs API.
- **Lip-Syncing**: Generates lip-sync data for the avatar using Rhubarb Lip Sync.
- **Facial Expressions and Animations**: Supports dynamic facial expressions and animations for the avatar.

### Prerequisites

- Node.js (v16 or higher)
- API keys for:
  - OpenAI
  - ElevenLabs
- Ensure `ffmpeg` and `rhubarb` are installed and available in your system's PATH.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/satyamshorrf/virtual-girlfriend.git
   cd backend
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

### Usage

#### Start the backend server:
   ```bash
   npm run dev
   ```
The server will run on `http://localhost:3000`.

### API Endpoints

#### `GET /`
Returns a simple "Hello World!" message.

#### `GET /voices`
Fetches available voices from the ElevenLabs API.

#### `POST /chat`
Handles chat requests. Accepts a JSON payload:
```json
{
  "message": "Hello!",
  "user_id": "12345"
}
```
Returns a JSON response with text, audio, lip-sync data, facial expressions, and animations.

### Development
Use `nodemon` for hot-reloading during development:
   ```bash
   npm install -g nodemon
   nodemon index.js
   ```

## References
- [Ready Player Me](https://readyplayer.me/)
- [Virtual Girlfriend GitHub](https://github.com/satyamshorrf/virtual-girlfriend.git)
- [gltfjsx](https://github.com/pmndrs/gltfjsx)
- [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync)

## License
This project is licensed under the MIT License.

---

# Contributing to Virtual Girlfriend

Thank you for considering contributing to this project! We welcome contributions from everyone. Please follow the guidelines below to ensure smooth collaboration.

## How to Contribute

1. **Fork the Repository**: Click on the `Fork` button at the top-right corner of the repository page to create a copy of the repository in your GitHub account.

2. **Clone Your Fork**: Clone your fork to your local machine using:
   ```sh
   git clone https://github.com/satyamshorrf/virtual-girlfriend.git
   ```

3. **Create a Branch**: Create a new branch for your changes:
   ```sh
   git checkout -b feature-branch
   ```

4. **Make Changes**: Implement your changes or improvements.

5. **Commit Your Changes**: Write a clear commit message:
   ```sh
   git commit -m "Added feature XYZ"
   ```

6. **Push to Your Fork**: Push the branch to your forked repository:
   ```sh
   git push origin feature-branch
   ```

7. **Submit a Pull Request**: Go to the original repository and open a Pull Request (PR) with a clear description of the changes you made.

## Code of Conduct

- Be respectful to other contributors.
- Follow the project's coding standards.
- Keep commits and pull requests well-documented.

## Issues & Bug Reports

If you find any bugs or issues, please open an issue in the repository and describe the problem clearly.

## Contributors

We appreciate all contributions! If you contribute, feel free to add your name below:

1. [**Satyam Kumar**](https://github.com/satyamshorrf)
2. [**Rajesh Kumar**](https://github.com/sigmarajesh)
3. [**Pratik Kumar**](https://github.com/Vicky7463)
4. [**Sandeep Kumar**](https://github.com/sandeepkrpoddar)
5. [**Kajal Kumari**](https://github.com/Kajall001)
6. [**Kajal Kumari**](https://github.com/kajuarya)


## License

By contributing to this project, you agree that your contributions will be licensed under the project's existing license.

Thank you for your contributions! 🚀

--- 

