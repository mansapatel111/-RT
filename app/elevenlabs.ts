import { Audio } from "expo-av";
import { API_KEYS } from "../config";

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = API_KEYS.ELEVENLABS;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Popular ElevenLabs voice IDs
export const ELEVENLABS_VOICES = {
  // Pre-made voices (available on free tier)
  Rachel: "21m00Tcm4TlvDq8ikWAM",
  Drew: "29vD33N1CtxCmqQRPOHJ",
  Clyde: "2EiwWnXFnvU5JabPnv8n",
  Paul: "5Q0t7uMcjvnagumLfvZi",
  Domi: "AZnzlk1XvdvUeBnXmlld",
  Dave: "CYw3kZ02Hs0563khs1Fj",
  Fin: "D38z5RcWu1voky8WS1ja",
  Bella: "EXAVITQu4vr4xnSDxMaL",
  Antoni: "ErXwobaYiN019PkySvjV",
  Thomas: "GBv7mTt0atIp3BR8iCZE",
  Charlie: "IKne3meq5aSn9XLyUdCD",
  Emily: "LcfcDJNUP1GQjkzn1xUU",
  Elli: "MF3mGyEYCl7XYWbV9V6O",
  Callum: "N2lVS1w4EtoT3dr4eOWO",
  Patrick: "ODq5zmih8GrVes37Dizd",
  Harry: "SOYHLrjzK2X1ezoPC6cr",
  Liam: "TX3LPaxmHKxFdv7VOQHJ",
  Dorothy: "ThT5KcBeYPX3keUQqHPh",
  Josh: "TxGEqnHWrfWFTfGW9XjX",
  Arnold: "VR6AewLTigWG4xSOukaG",
  Charlotte: "XB0fDUnXU5powFXDhCwa",
  Alice: "Xb7hH8MSUJpSbSDYk0k2",
  Matilda: "XrExE9yKIg1WjnnlVkGX",
  James: "ZQe5CZNOzWyzPSCn5a3c",
  Joseph: "Zlb1dXrM653N07WRdFW3",
  Jeremy: "bVMeCyTHy58xNoL34h3p",
  Michael: "flq6f7yk4E4fJM5XTYuZ",
  Ethan: "g5CIjZEefAph4nQFvHAz",
  Chris: "iP95p4xoKVk53GoZ742B",
  Gigi: "jBpfuIE2acCO8z3wKNLl",
  Freya: "jsCqWAovK2LkecY7zXl4",
  Brian: "nPczCjzI2devNBz1zQrb",
  Grace: "oWAxZDx7w5VEj9dCyTzz",
  Daniel: "onwK4e9ZLuTAKqWW03F9",
  Lily: "pFZP5JQG7iQjIQuC4Bku",
  Serena: "pMsXgVXv3BLzUgSXRplE",
  Adam: "pNInz6obpgDQGcFmaJgB",
  Nicole: "piTKgcLEGmPE4e6mEKli",
  Bill: "pqHfZKP75CvOlQylNhV4",
  Jessie: "t0jbNlBVZ17f02VDIeMI",
  Sam: "yoZ06aMxZJJ28mfd3POQ",
  Glinda: "z9fAnlkpzviPz146aGWa",
  Giovanni: "zcAOhNBS3c14rBihAFp1",
  Mimi: "zrHiDhphv9ZnVXBqCLjz",
};

export type ElevenLabsVoice = keyof typeof ELEVENLABS_VOICES;

interface ElevenLabsOptions {
  voice?: ElevenLabsVoice;
  model_id?:
    | "eleven_monolingual_v1"
    | "eleven_multilingual_v1"
    | "eleven_multilingual_v2"
    | "eleven_turbo_v2"
    | "eleven_turbo_v2_5";
  stability?: number; // 0 to 1
  similarity_boost?: number; // 0 to 1
  style?: number; // 0 to 1
  use_speaker_boost?: boolean;
}

let currentSound: Audio.Sound | null = null;

/**
 * Generate speech using ElevenLabs API and play it
 * @param text The text to convert to speech
 * @param options Voice and audio options
 * @param onDone Callback when speech finishes
 * @param onError Callback when an error occurs
 */
export async function speakWithElevenLabs(
  text: string,
  options?: ElevenLabsOptions,
  onDone?: () => void,
  onError?: (error: Error) => void,
): Promise<Audio.Sound | null> {
  try {
    // Stop any currently playing speech
    await stopElevenLabs();

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voice = options?.voice || "Rachel";
    const voiceId = ELEVENLABS_VOICES[voice];

    console.log("🎙️ Making ElevenLabs API request...");
    console.log("Voice:", voice);
    console.log("Voice ID:", voiceId);

    // Make API request to ElevenLabs
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: options?.model_id || "eleven_turbo_v2_5", // Fast, high-quality model
          voice_settings: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarity_boost ?? 0.75,
            style: options?.style ?? 0.0,
            use_speaker_boost: options?.use_speaker_boost ?? true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(
        `ElevenLabs API error: ${response.status} - ${errorText}`,
      );
    }

    console.log("✅ ElevenLabs API response received");

    // Get audio data as blob
    const audioBlob = await response.blob();

    // Convert blob to base64
    const reader = new FileReader();
    const base64Audio = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    console.log("🎵 Playing ElevenLabs audio...");

    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: base64Audio },
      { shouldPlay: true },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log("✅ ElevenLabs audio finished playing");
          onDone?.();
        }
      },
    );

    currentSound = sound;
    console.log("✅ ElevenLabs audio started playing");

    return sound;
  } catch (error) {
    console.error("❌ ElevenLabs speech error:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    return null;
  }
}

/**
 * Stop currently playing ElevenLabs speech
 */
export async function stopElevenLabs(): Promise<void> {
  try {
    if (currentSound) {
      console.log("⏹️ Stopping ElevenLabs audio...");
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      console.log("✅ ElevenLabs audio stopped");
    }
  } catch (error) {
    console.warn("⚠️ Error stopping ElevenLabs audio:", error);
    currentSound = null;
  }
}

/**
 * Check if ElevenLabs audio is currently playing
 */
export function isElevenLabsPlaying(): boolean {
  return currentSound !== null;
}

/**
 * Get available character count (requires API key)
 * Useful for monitoring usage limits
 */
export async function getCharacterCount(): Promise<{
  character_count: number;
  character_limit: number;
} | null> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      character_count: data.subscription?.character_count || 0,
      character_limit: data.subscription?.character_limit || 0,
    };
  } catch (error) {
    console.error("❌ Error fetching character count:", error);
    return null;
  }
}

export default {
  speakWithElevenLabs,
  stopElevenLabs,
  isElevenLabsPlaying,
  getCharacterCount,
  ELEVENLABS_VOICES,
};
