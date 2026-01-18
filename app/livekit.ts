import { API_KEYS } from "../config";

// LiveKit Room Configuration
export interface LiveKitRoomConfig {
  roomName: string;
  userName: string;
  metadata?: {
    imageUri?: string;
    artworkData?: any;
  };
}

/**
 * Generate a LiveKit access token for joining a room
 * Note: In production, this should be done server-side for security
 */
export async function generateLiveKitToken(
  roomName: string,
  participantName: string,
  metadata?: string,
): Promise<string> {
  // IMPORTANT: Must include http:// or https:// protocol
  const endpoint = "http://172.20.10.4:5001/api/livekit/token";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName,
        participantName,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("❌ Failed to generate LiveKit token:", error);
    throw error;
  }
}

/**
 * Get LiveKit connection URL
 */
export function getLiveKitUrl(): string {
  return API_KEYS.LIVEKIT.URL;
}

/**
 * Create a unique room name for an artwork session
 */
export function createArtworkRoomName(artworkTitle: string): string {
  const timestamp = Date.now();
  const sanitized = artworkTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 50);
  return `artwork-${sanitized}-${timestamp}`;
}

/**
 * LiveKit Room Metadata for AI Agent
 */
export interface ArtworkMetadata {
  imageUri: string;
  title: string;
  artist?: string;
  type?: string;
  description?: string;
  historicalContext?: string;
  emotions?: string;
}

/**
 * Format artwork data as metadata for the AI agent
 */
export function formatArtworkMetadata(artwork: ArtworkMetadata): string {
  return JSON.stringify({
    type: "artwork_analysis",
    data: {
      title: artwork.title,
      artist: artwork.artist,
      type: artwork.type,
      description: artwork.description,
      historicalContext: artwork.historicalContext,
      emotions: artwork.emotions,
      imageUri: artwork.imageUri,
    },
    instructions:
      "You are an expert art historian and guide. Answer questions about this artwork based on the provided information. Be engaging, informative, and conversational.",
  });
}

export default {
  generateLiveKitToken,
  getLiveKitUrl,
  createArtworkRoomName,
  formatArtworkMetadata,
};
