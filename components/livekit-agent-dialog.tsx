import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Room, RoomEvent, Track } from "livekit-client";
import {
  ArtworkMetadata,
  createArtworkRoomName,
  formatArtworkMetadata,
  generateLiveKitToken,
  getLiveKitUrl,
} from "../app/livekit";

interface LiveKitAgentDialogProps {
  visible: boolean;
  onClose: () => void;
  artworkData: ArtworkMetadata;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export default function LiveKitAgentDialog({
  visible,
  onClose,
  artworkData,
}: LiveKitAgentDialogProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  
  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<any>(null);

  // Initialize LiveKit connection when dialog opens
  useEffect(() => {
    if (visible) {
      connectToLiveKit();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [visible]);

  const connectToLiveKit = async () => {
    try {
      setConnectionState("connecting");
      console.log("🎙️ Starting LiveKit connection...");

      // Create a unique room for this conversation
      const roomName = createArtworkRoomName(artworkData.title);
      const participantName = "User";
      const metadata = formatArtworkMetadata(artworkData);

      console.log("📝 Room name:", roomName);
      console.log("👤 Participant:", participantName);

      // Generate access token
      console.log("🔑 Requesting access token...");
      const token = await generateLiveKitToken(
        roomName,
        participantName,
        metadata,
      );
      console.log("✅ Token received");

      // Create LiveKit Room
      const room = new Room();
      roomRef.current = room;

      // Set up event listeners BEFORE connecting
      room.on(RoomEvent.Connected, () => {
        console.log("✅ Connected to LiveKit room");
        setConnectionState("connected");
        addTranscription(
          "System: Connected to AI guide. Speak your question about the artwork."
        );
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log("📡 Disconnected from room");
        setConnectionState("disconnected");
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("👤 Participant joined:", participant.identity);
        if (participant.identity === "art-guide-agent") {
          addTranscription(async () => {
    console.log("🔌 Disconnecting from LiveKit...");
    
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
        roomRef.current = null;
        localAudioTrackRef.current = null;
        console.log("✅ Disconnected successfully");
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }
    
    setConnectionState("disconnected");
    setTranscription([]);
    setAgentSpeaking(false);
  }, []);

  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;
    
    try {
      const newMutedState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
      console.log(newMutedState ? "🔇 Microphone muted" : "🎤 Microphone unmuted");
      
      addTranscription(
        `System: Microphone ${newMutedState ? "muted" : "unmuted"}`
      );
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
        if (track.kind === Track.Kind.Audio && participant.identity === "art-guide-agent") {
          setAgentSpeaking(true);
          // The audio will automatically play through the device speakers
          console.log("🔊 Agent is speaking...");
          
          // Detect when agent stops speaking
          track.on("ended", () => {
            setAgentSpeaking(false);
            console.log("🔇 Agent finished speaking");
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity === "art-guide-agent") {
          setAgentSpeaking(false);
        }
      });

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        // Handle any data messages (transcriptions, etc.)
        try {
          const message = new TextDecoder().decode(payload);
          console.log("📨 Data received:", message);
          addTranscription(`Agent: ${message}`);
        } catch (e) {
          console.warn("Failed to decode data message:", e);
        }
      });

      // Connect to the room
      const livekitUrl = getLiveKitUrl();
      console.log("🌐 Connecting to:", livekitUrl);
      
      await room.connect(livekitUrl, token);
      console.log("📡 Room connected successfully");

      // Enable local audio (microphone)
      console.log("🎤 Enabling microphone...");
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("✅ Microphone enabled");

      // Store reference to local audio track
      const audioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (audioTrack) {
        localAudioTrackRef.current = audioTrack;
        console.log("✅ Local audio track ready");
      }

    } catch (error) {
      console.error("❌ Failed to connect to LiveKit:", error);
      setConnectionState("failed");
      
      if (error instanceof Error) {
        addTranscription(`Error: ${error.message}`);
        
        // Show user-friendly error
        Alert.alert(
          "Connection Failed",
          "Could not connect to the AI guide. Please ensure:\n" +
          "1. Token server is running\n" +
          "2. LiveKit credentials are configured\n" +
          "3. Network connection is available",
          [{ text: "OK" }]
        );
      }
    }
  };

  const disconnect = useCallback(() => {
    // TODO: Cleanup LiveKit Room connection
    setConnectionState("disconnected");
    setTranscription([]);
  }, []);

  const toggleMute = useCallback(() => {
    // TODO: Mute/unmute local audio track
    setIsMuted(!isMuted);
  }, [isMuted]);

  const addTranscription = (text: string) => {
    setTranscription((prev) => [...prev, text]);
  };

  const renderConnectionStatus = () => {
    switch (connectionState) {
      case "connecting":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.statusText}>Connecting to AI guide...</Text>
          </View>
        );
      case "connected":
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statusText, { color: "#4CAF50" }]}>
              Connected - Speak to ask questions
            </Text>
          </View>
        );
      case "failed":
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="error" size={24} color="#F44336" />
            <Text style={[styles.statusText, { color: "#F44336" }]}>
              Connection failed. Please try again.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Art Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Artwork Info */}
          <View style={styles.artworkInfo}>
            <Text style={styles.artworkTitle}>{artworkData.title}</Text>
            {artworkData.artist && (
              <Text style={styles.artworkArtist}>by {artworkData.artist}</Text>
            )}
          </View>

          {/* Connection Status */}
          {renderConnectionStatus()}

          {/* Transcription Area */}
          <View style={styles.transcriptionContainer}>
            {transcription.length === 0 ? (
              <Text style={styles.emptyText}>
                Your conversation will appear here...
              </Text>
            ) : (
              transcription.map((text, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageContainer,
                    text.startsWith("Agent:") && styles.agentMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{text}</Text>
                </View>
              ))
            )}
          </View>

          {/* Controls */}
          {connectionState === "connected" && (
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.mutedButton]}
                onPress={toggleMute}
              >
                <MaterialIcons
                  name={isMuted ? "mic-off" : "mic"}
                  size={32}
                  color="white"
                />
                <Text style={styles.controlText}>
                  {isMuted ? "Unmute" : "Mute"}
                </Text>
              </TouchableOpacity>

              {agentSpeaking && (
                <View style={styles.speakingIndicator}>
                  <MaterialIcons name="volume-up" size={24} color="#4A90E2" />
                  <Text style={styles.speakingText}>Agent is speaking...</Text>
                </View>
              )}
            </View>
          )}

          {/* Retry Button */}
          {connectionState === "failed" && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={connectToLiveKit}
            >
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  artworkInfo: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  artworkArtist: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginBottom: 15,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  transcriptionContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  agentMessage: {
    backgroundColor: "#F5F5F5",
  },
  messageText: {
    fontSize: 14,
    color: "#333",
  },
  controls: {
    alignItems: "center",
    gap: 15,
  },
  controlButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 50,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  mutedButton: {
    backgroundColor: "#999",
  },
  controlText: {
    color: "white",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "600",
  },
  speakingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  speakingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4A90E2",
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
