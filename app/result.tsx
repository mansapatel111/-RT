import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // analyzeImage returns fields: imageUri, title, artist, type, description, historicalPrompt, immersivePrompt, emotions, audioUri
  const { imageUri, title, artist, type, description, historicalPrompt, immersivePrompt, emotions, audioUri } = params as any;

  const [sound, setSound] = useState<any | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isPlayingHistorical, setIsPlayingHistorical] = useState(false);
  const [isPlayingImmersive, setIsPlayingImmersive] = useState(false);

  useEffect(() => {
    // Auto-play music when the screen loads (if available)
    if (audioUri) {
      playMusic();
    }

    // Optionally auto-narrate description for accessibility
    if (description) {
      AccessibilityInfo.announceForAccessibility('Description loaded.');
    }

    return () => {
      if (sound && typeof sound.unloadAsync === 'function') {
        sound.unloadAsync();
      }
      Speech.stop();
    };
  }, [audioUri, description]);

  const playMusic = async () => {
    try {
      if (sound && typeof sound.unloadAsync === 'function') {
        await sound.unloadAsync();
      }

      if (audioUri) {
        const { sound: s } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        setSound(s);
        setIsPlayingMusic(true);

        s.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlayingMusic(false);
          }
        });
      } else {
        console.warn('No generated audio available');
      }
    } catch (e) {
      console.warn('playMusic failed', e);
      setIsPlayingMusic(false);
    }
  };

  const onReadHistoricalDescription = () => {
    if (isPlayingHistorical) {
      // Stop the speech
      Speech.stop();
      setIsPlayingHistorical(false);
    } else {
      // Stop immersive if playing
      if (isPlayingImmersive) {
        Speech.stop();
        setIsPlayingImmersive(false);
      }

      const textToRead = historicalPrompt || description;
      if (textToRead) {
        setIsPlayingHistorical(true);
        Speech.speak(textToRead, {
          language: 'en-US',
          onDone: () => setIsPlayingHistorical(false),
          onStopped: () => setIsPlayingHistorical(false),
          onError: () => setIsPlayingHistorical(false),
        });
      }
    }
  };

  const onReadImmersiveDescription = () => {
    if (isPlayingImmersive) {
      // Stop the speech
      Speech.stop();
      setIsPlayingImmersive(false);
    } else {
      // Stop historical if playing
      if (isPlayingHistorical) {
        Speech.stop();
        setIsPlayingHistorical(false);
      }

      const textToRead = immersivePrompt || description;
      if (textToRead) {
        setIsPlayingImmersive(true);
        Speech.speak(textToRead, {
          language: 'en-US',
          onDone: () => setIsPlayingImmersive(false),
          onStopped: () => setIsPlayingImmersive(false),
          onError: () => setIsPlayingImmersive(false),
        });
      }
    }
  };

  const onSave = () => {
    AccessibilityInfo.announceForAccessibility('Saved to your favorites');
    // TODO: persist to local storage or cloud
  };

  return (
    <ScrollView contentContainerStyle={styles.container} accessible accessibilityRole="summary">
      <View style={styles.headerCard}>
        {imageUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {artist ? <Text style={styles.artist}>by {artist}</Text> : null}
        {type ? <Text style={styles.type}>{type}</Text> : null}

        <View style={styles.pillsRow}>
          {(() => {
            // normalize emotions which may arrive as an array or a serialized string from router params
            const raw = emotions as any;
            let list: string[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (typeof raw === 'string') {
              // try JSON first (e.g. '["calm","dreamy"]') then comma-separated
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed.map(String);
                else list = [raw];
              } catch {
                list = raw.split(',').map((s) => s.trim()).filter(Boolean);
              }
            }
            return list.map((e: string) => (
              <View key={e} style={[styles.pill, { backgroundColor: pillColor(e) }]}>
                <Text style={styles.pillText}>{capitalize(e)}</Text>
              </View>
            ));
          })()}
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.audioCard}>
          <Text style={styles.sectionTitleLight}>Audio Experience</Text>
          {audioUri && (
            <View style={styles.musicStatus}>
              <MaterialIcons name="music-note" size={18} color="#9CA3AF" />
              <Text style={styles.musicStatusText}>
                {isPlayingMusic ? '🎵 Music playing...' : '🎵 Music auto-played'}
              </Text>
            </View>
          )}
          <View style={styles.audioButtons}>
            <TouchableOpacity
              style={styles.audioButtonPrimary}
              accessibilityRole="button"
              accessibilityLabel={isPlayingHistorical ? "Pause historical description" : "Read historical description aloud"}
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
              accessibilityLabel={isPlayingImmersive ? "Pause immersive description" : "Read immersive description aloud"}
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
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.actionButton} accessibilityRole="button" onPress={onSave}>
            <MaterialIcons name="bookmark" size={20} color="#fff" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonOutline} accessibilityRole="button" onPress={() => router.replace('/')}>
            <Text style={styles.actionTextOutline}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function pillColor(name: string) {
  const s = String(name).toLowerCase();
  if (s.includes('dream') || s.includes('calm')) return '#7C3AED'; // purple
  if (s.includes('melanch')) return '#4F46E5'; // indigo
  if (s.includes('ener')) return '#F97316'; // orange
  if (s.includes('myst')) return '#8B5CF6'; // violet
  if (s.includes('romant')) return '#EF4444'; // red
  return '#6B7280';
}

function capitalize(s?: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#070812', paddingBottom: 40 },
  headerCard: { padding: 16, backgroundColor: '#071122' },
  imageWrap: { height: 260, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1220' },
  image: { width: '60%', height: '100%' },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  title: { color: '#fff', fontSize: 42, fontWeight: '800', marginBottom: 6 },
  artist: { color: '#cbd5e1', fontSize: 16, marginBottom: 4 },
  type: { color: '#94a3b8', fontSize: 14, marginBottom: 10 },
  pillsRow: { flexDirection: 'row', gap: 10, marginVertical: 12, flexWrap: 'wrap' as any },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  pillText: { color: '#fff', fontWeight: '700' },
  descriptionCard: { backgroundColor: '#0b1220', borderRadius: 12, padding: 16, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sectionTitleLight: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { color: '#cbd5e1', fontSize: 16, lineHeight: 22 },
  audioCard: { marginTop: 18, backgroundColor: '#2b0738', padding: 16, borderRadius: 12 },
  musicStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 8 },
  musicStatusText: { color: '#9CA3AF', fontSize: 14, fontStyle: 'italic' },
  audioButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  audioButtonPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 10, marginRight: 8 },
  audioButtonSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#5B21B6', paddingVertical: 14, borderRadius: 10 },
  audioButtonText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  audioHint: { color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '700' },
  actionButtonOutline: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionTextOutline: { color: '#fff', fontWeight: '700' },
});
