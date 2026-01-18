# LiveKit Integration Setup Guide

This guide will help you integrate LiveKit voice agent dialogue into your React Native Expo app.

## Overview

The LiveKit integration allows users to have voice conversations with an AI agent about the artwork they've photographed. The agent uses GPT-4 to provide informative, engaging answers about the artwork.

## Prerequisites

1. **LiveKit Cloud Account**
   - Sign up at [cloud.livekit.io](https://cloud.livekit.io)
   - Create a new project
   - Get your API Key, API Secret, and WebSocket URL

2. **OpenAI API Key**
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create an API key with access to GPT-4

## Installation Steps

### 1. Install Frontend Dependencies

```bash
npm install @livekit/react-native livekit-client @livekit/react-native-webrtc
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install livekit-api livekit livekit-agents livekit-plugins-openai livekit-plugins-silero flask flask-cors openai python-dotenv
```

### 3. Configure Environment Variables

#### Frontend (`config.ts`)

Update your LiveKit configuration:

```typescript
export const API_KEYS = {
  ELEVENLABS: "your-elevenlabs-key",
  LIVEKIT: {
    URL: "wss://your-project.livekit.cloud",
    API_KEY: "your-api-key",
    API_SECRET: "your-api-secret",
  },
};
```

#### Backend (`backend/.env`)

Create a `.env` file in the backend directory:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with your credentials:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-api-key
```

### 4. Update Token Generation

In `app/livekit.ts`, update the backend endpoint URL:

```typescript
const endpoint = "http://YOUR_IP_ADDRESS:5001/api/livekit/token";
// Replace YOUR_IP_ADDRESS with your computer's local IP
// Find it with: ifconfig (Mac/Linux) or ipconfig (Windows)
```

### 5. iOS Configuration (if building for iOS)

Add microphone permissions to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to your microphone to enable voice conversations with the AI art guide."
      }
    }
  }
}
```

### 6. Android Configuration (if building for Android)

Permissions are already handled by the LiveKit SDK, but ensure you have:

```json
{
  "expo": {
    "android": {
      "permissions": ["RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS"]
    }
  }
}
```

## Running the Services

### 1. Start the Token Server

```bash
cd backend
python livekit_token_server.py
```

The token server will run on `http://localhost:5001`

### 2. Start the AI Agent

In a new terminal:

```bash
cd backend
python livekit_agent_example.py
```

The agent will connect to LiveKit and wait for room sessions.

### 3. Start Your React Native App

```bash
npx expo start
```

## Usage in Your App

### Adding the Dialog to Result Screen

Update `app/result.tsx` to include the LiveKit dialog:

```typescript
import LiveKitAgentDialog from "@/components/livekit-agent-dialog";
import { ArtworkMetadata } from "./livekit";

// In your component
const [showAgentDialog, setShowAgentDialog] = useState(false);

const artworkMetadata: ArtworkMetadata = {
  imageUri: imageUri as string,
  title: title as string,
  artist: artist as string,
  type: type as string,
  description: description as string,
  historicalContext: historicalPrompt as string,
  emotions: emotions as string,
};

// Add a button to open the dialog
<TouchableOpacity
  style={styles.agentButton}
  onPress={() => setShowAgentDialog(true)}
>
  <MaterialIcons name="chat" size={24} color="white" />
  <Text>Ask AI Guide</Text>
</TouchableOpacity>

// Add the dialog component
<LiveKitAgentDialog
  visible={showAgentDialog}
  onClose={() => setShowAgentDialog(false)}
  artworkData={artworkMetadata}
/>
```

## Architecture

### Frontend (React Native)

1. User opens the AI Guide dialog
2. App generates a unique room name
3. App requests an access token from your backend
4. App connects to LiveKit room using the token
5. User speaks, audio is sent to LiveKit
6. LiveKit routes audio to the AI agent

### Backend (Python)

1. **Token Server** (`livekit_token_server.py`)
   - Generates secure JWT tokens for LiveKit access
   - Runs on port 5001

2. **AI Agent** (`livekit_agent_example.py`)
   - Listens for new room sessions
   - Receives user audio via LiveKit
   - Processes with OpenAI Whisper (speech-to-text)
   - Generates responses with GPT-4
   - Converts to speech with OpenAI TTS or ElevenLabs
   - Sends audio back via LiveKit

### LiveKit Cloud

- Handles real-time audio streaming
- Routes audio between participants and agents
- Manages room sessions

## Testing

1. Start all services (token server, agent, and React Native app)
2. Scan an artwork in your app
3. On the result screen, tap "Ask AI Guide"
4. Wait for connection (should take 1-2 seconds)
5. Speak your question about the artwork
6. Listen to the AI agent's response

## Troubleshooting

### Connection Issues

- Ensure backend services are running
- Check that your LiveKit credentials are correct
- Verify the token server URL in `app/livekit.ts` is accessible from your device
- Use your computer's local IP address, not `localhost`

### Audio Issues

- Grant microphone permissions to the app
- Check device volume and ensure not on silent mode
- Test with headphones to avoid echo/feedback

### Agent Not Responding

- Check OpenAI API key is valid and has GPT-4 access
- Look at agent logs for errors
- Ensure the agent successfully connected to LiveKit

## Next Steps

1. **Customize the Agent**: Edit `livekit_agent_example.py` to modify agent personality and responses
2. **Add Visual Features**: Stream camera feed to show artwork to the agent
3. **Better TTS**: Replace OpenAI TTS with ElevenLabs for higher quality voices
4. **Conversation History**: Store and display past conversations
5. **Multi-language Support**: Add language detection and translation

## Resources

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit React Native SDK](https://docs.livekit.io/client-sdk-js/react-native/)
- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Security Notes

⚠️ **Important**: Never expose your API keys in client-side code!

- Token generation must happen server-side (which is why we have `livekit_token_server.py`)
- Don't commit `.env` files to version control
- Add `.env` to your `.gitignore`
- In production, use a proper backend (Node.js, Python, etc.) instead of running locally

## Support

If you encounter issues:

1. Check LiveKit dashboard for room and agent status
2. Review logs from token server and agent
3. Enable debug mode in the React Native app
4. Check the [LiveKit Community Forum](https://livekit.io/community)
