import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { speakWithElevenLabs, stopElevenLabs } from "./elevenlabs";

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // analyzeImage returns fields: imageUri, title, artist, type, description, historicalPrompt, immersivePrompt, emotions, audioUri
  const {
    imageUri,
    title,
    artist,
    type,
    description,
    historicalPrompt,
    immersivePrompt,
    emotions,
    audioUri,
  } = params as any;

  const [sound, setSound] = useState<any | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isPlayingHistorical, setIsPlayingHistorical] = useState(false);
  const [isPlayingImmersive, setIsPlayingImmersive] = useState(false);
  const [showHistoricalTranscript, setShowHistoricalTranscript] =
    useState(false);

  useEffect(() => {
    // Auto-play music when the screen loads (if available)
    if (audioUri) {
      playMusic();
    }

    // TTS announcement disabled per user request

    return () => {
      if (sound && typeof sound.unloadAsync === "function") {
        sound.unloadAsync();
      }
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUri, description, title]);

  const playMusic = async () => {
    try {
      if (sound && typeof sound.unloadAsync === "function") {
        await sound.unloadAsync();
      }

      if (audioUri) {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
        );
        setSound(s);
        setIsPlayingMusic(true);

        s.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlayingMusic(false);
          }
        });
      } else {
        console.warn("No generated audio available");
      }
    } catch (e) {
      console.warn("playMusic failed", e);
      setIsPlayingMusic(false);
    }
  };

  const onReadHistoricalDescription = async () => {
    if (isPlayingHistorical) {
      // Stop the ElevenLabs audio
      await stopElevenLabs();
      setIsPlayingHistorical(false);
    } else {
      // Stop immersive if playing
      if (isPlayingImmersive) {
        await stopElevenLabs();
        setIsPlayingImmersive(false);
      }

      const textToRead = historicalPrompt || description;
      if (textToRead) {
        setIsPlayingHistorical(true);
        setShowHistoricalTranscript(true); // Show transcript when playing
        await speakWithElevenLabs(
          textToRead,
          {
            voice: "Rachel", // Calm, clear female voice
            stability: 0.5,
            similarity_boost: 0.75,
          },
          () => setIsPlayingHistorical(false),
          (error) => {
            console.error("ElevenLabs error:", error);
            setIsPlayingHistorical(false);
          },
        );
      }
    }
  };

  const onReadImmersiveDescription = async () => {
    if (isPlayingImmersive) {
      // Stop the ElevenLabs audio
      await stopElevenLabs();
      setIsPlayingImmersive(false);
    } else {
      // Stop historical if playing
      if (isPlayingHistorical) {
        await stopElevenLabs();
        setIsPlayingHistorical(false);
      }

      const textToRead = immersivePrompt || description;
      if (textToRead) {
        setIsPlayingImmersive(true);
        await speakWithElevenLabs(
          textToRead,
          {
            voice: "Bella", // Expressive, engaging voice
            stability: 0.4, // More variation for immersive feeling
            similarity_boost: 0.8,
            style: 0.3, // Add more emotion
          },
          () => setIsPlayingImmersive(false),
          (error) => {
            console.error("ElevenLabs error:", error);
            setIsPlayingImmersive(false);
          },
        );
      }
    }
  };

  const onTakeAnother = () => {
    router.push("/scan/museum" as unknown as any);
  };

  const onBackToHome = async () => {
    try {
      // Stop any playing music
      if (sound && typeof sound.unloadAsync === "function") {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingMusic(false);
      }

      // Stop any ElevenLabs audio
      await stopElevenLabs();
      setIsPlayingHistorical(false);
      setIsPlayingImmersive(false);

      // Stop default speech synthesis
      Speech.stop();

      // Navigate back to home
      router.replace("/");
    } catch (error) {
      console.warn("Error stopping audio:", error);
      // Navigate anyway even if audio stopping fails
      router.replace("/");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        {imageUri ? (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          accessibilityLabel={`Artwork title: ${title}`}
        >
          {title}
        </Text>
        {artist ? (
          <Text style={styles.artist} accessibilityLabel={`Artist: ${artist}`}>
            by {artist}
          </Text>
        ) : null}
        {type ? (
          <Text
            style={styles.type}
            accessibilityLabel={`Artwork type: ${type}`}
          >
            {type}
          </Text>
        ) : null}

        <View
          style={styles.pillsRow}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Emotions: ${(() => {
            const raw = emotions as any;
            let list: string[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (typeof raw === "string") {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed.map(String);
                else list = [raw];
              } catch {
                list = raw
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
              }
            }
            return list.join(", ");
          })()}`}
        >
          {(() => {
            // normalize emotions which may arrive as an array or a serialized string from router params
            const raw = emotions as any;
            let list: string[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (typeof raw === "string") {
              // try JSON first (e.g. '["calm","dreamy"]') then comma-separated
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed.map(String);
                else list = [raw];
              } catch {
                list = raw
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
              }
            }
            return list.map((e: string) => (
              <View
                key={e}
                style={[styles.pill, { backgroundColor: pillColor(e) }]}
              >
                <Text style={styles.pillText}>{capitalize(e)}</Text>
              </View>
            ));
          })()}
        </View>

        <View style={styles.audioCard}>
          <Text style={styles.sectionTitleLight} accessibilityRole="header">
            Audio Experience
          </Text>
          {audioUri && (
            <View style={styles.musicStatus}>
              <MaterialIcons name="music-note" size={18} color="#9CA3AF" />
              <Text
                style={styles.musicStatusText}
                accessibilityLabel={
                  isPlayingMusic
                    ? "Background music is currently playing"
                    : "Background music has finished playing"
                }
              >
                {isPlayingMusic
                  ? "🎵 Music playing..."
                  : "🎵 Music auto-played"}
              </Text>
            </View>
          )}
          <View style={styles.audioButtons}>
            <TouchableOpacity
              style={styles.audioButtonPrimary}
              accessibilityRole="button"
              accessibilityLabel={
                isPlayingHistorical ? "Pause" : "Historical description"
              }
              accessibilityHint={
                isPlayingHistorical
                  ? "Double tap to pause the historical description"
                  : "Double tap to hear a historical perspective of this artwork"
              }
              onPress={onReadHistoricalDescription}
            >
              <MaterialIcons
                name={isPlayingHistorical ? "pause" : "history-edu"}
                size={22}
                color="#fff"
              />
              <Text style={styles.audioButtonText}>
                {isPlayingHistorical ? "Pause" : "Historical"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.audioButtonSecondary}
              accessibilityRole="button"
              accessibilityLabel={
                isPlayingImmersive ? "Pause" : "Immersive description"
              }
              accessibilityHint={
                isPlayingImmersive
                  ? "Double tap to pause the immersive description"
                  : "Double tap to hear an immersive, sensory perspective of this artwork"
              }
              onPress={onReadImmersiveDescription}
            >
              <MaterialIcons
                name={isPlayingImmersive ? "pause" : "auto-awesome"}
                size={22}
                color="#fff"
              />
              <Text style={styles.audioButtonText}>
                {isPlayingImmersive ? "Pause" : "Immersive"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.audioHint}>
            Tap buttons to hear different perspectives on this artwork
          </Text>

          {showHistoricalTranscript && (
            <View style={styles.transcriptSection}>
              <TouchableOpacity
                style={styles.transcriptToggle}
                onPress={() =>
                  setShowHistoricalTranscript(!showHistoricalTranscript)
                }
                accessibilityRole="button"
                accessibilityLabel="Transcript"
                accessibilityHint="Double tap to collapse the text transcript"
              >
                <Text style={styles.transcriptTitle}>Transcript</Text>
                <MaterialIcons name="expand-less" size={24} color="#fff" />
              </TouchableOpacity>
              <Text
                style={styles.transcriptText}
                accessibilityLabel={`Transcript: ${historicalPrompt || description}`}
              >
                {historicalPrompt || description}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Take another picture"
            accessibilityHint="Double tap to return to camera to scan another artwork"
            onPress={onTakeAnother}
          >
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.actionText}>Take Another Picture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonOutline}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            accessibilityHint="Double tap to return to the home screen"
            onPress={onBackToHome}
          >
            <Text style={styles.actionTextOutline}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function pillColor(name: string) {
  const s = String(name).toLowerCase();
  if (s.includes("dream") || s.includes("calm")) return "#7C3AED"; // purple
  if (s.includes("melanch")) return "#4F46E5"; // indigo
  if (s.includes("ener")) return "#F97316"; // orange
  if (s.includes("myst")) return "#8B5CF6"; // violet
  if (s.includes("romant")) return "#EF4444"; // red
  return "#6B7280";
}

function capitalize(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#070812", paddingBottom: 40 },
  headerCard: { padding: 16, backgroundColor: "#071122" },
  imageWrap: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
  },
  image: { width: "60%", height: "100%" },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  title: { color: "#fff", fontSize: 42, fontWeight: "800", marginBottom: 6 },
  artist: { color: "#cbd5e1", fontSize: 16, marginBottom: 4 },
  type: { color: "#94a3b8", fontSize: 14, marginBottom: 10 },
  pillsRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
    flexWrap: "wrap" as any,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: { color: "#fff", fontWeight: "700" },
  descriptionCard: {
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  transcriptCard: {
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionTitleLight: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: { color: "#cbd5e1", fontSize: 16, lineHeight: 22 },
  audioCard: {
    marginTop: 18,
    backgroundColor: "#2b0738",
    padding: 16,
    borderRadius: 12,
  },
  musicStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  musicStatusText: { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  audioButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  audioButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 8,
  },
  audioButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5B21B6",
    paddingVertical: 14,
    borderRadius: 10,
  },
  audioButtonText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  audioHint: { color: "#9CA3AF", marginTop: 12, textAlign: "center" },
  transcriptSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
  },
  transcriptToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transcriptTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  transcriptText: { color: "#cbd5e1", fontSize: 14, lineHeight: 20 },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionText: { color: "#fff", fontWeight: "700" },
  actionButtonOutline: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionTextOutline: { color: "#fff", fontWeight: "700" },
});
