import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const { imageUri, title, artist, type, description, emotions } = params as any;

  const [sound, setSound] = useState<any | null>(null);

  useEffect(() => {
    // Auto-narrate description for visually impaired users
    if (description) {
      AccessibilityInfo.announceForAccessibility('Description loaded. Playing narration.');
      Speech.speak(description, { language: 'en-US' });
    }

    return () => {
      if (sound && typeof sound.unloadAsync === 'function') {
        sound.unloadAsync();
      }
      Speech.stop();
    };
  }, [description, sound]);

  const playFallbackAudio = async () => {
    // play a simple tone or bundled file in a real app. For demo, we use silence or a generated URI.
    try {
      const { sound: s } = await Audio.Sound.createAsync(require('@/assets/images/partial-react-logo.png') as any, { shouldPlay: true });
      // the above is a placeholder and will fail until replaced with a real audio file
      setSound(s);
    } catch (e) {
      console.warn('Audio play failed (placeholder)', e);
    }
  };

  const onReplayAudio = async () => {
    if (sound) {
      await sound.replayAsync();
    } else {
      await playFallbackAudio();
    }
  };

  const onSave = () => {
    AccessibilityInfo.announceForAccessibility('Saved to your favorites');
    // placeholder: save to local store or cloud
  };

  return (
    <ScrollView contentContainerStyle={styles.container} accessible accessibilityRole="summary">
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}

      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {artist ? <Text style={styles.meta}>By {artist}</Text> : null}
        {type ? <Text style={styles.meta}>{type}</Text> : null}

        <Text style={styles.description}>{description}</Text>

        <View style={styles.emotions}>
          {(emotions || []).map((e: string) => (
            <View key={e} style={[styles.tag, { backgroundColor: e === 'calm' ? '#60A5FA' : e === 'romantic' ? '#F472B6' : '#F59E0B' }]}>
              <Text style={styles.tagText}>{e}</Text>
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Play generated audio" onPress={onReplayAudio} style={styles.controlButton}>
            <MaterialIcons name="play-arrow" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Replay narration" onPress={() => Speech.speak(description)} style={styles.controlButton}>
            <MaterialIcons name="record-voice-over" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Narration</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save" onPress={onSave} style={styles.controlButton}>
            <MaterialIcons name="bookmark" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to home" onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  image: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12, backgroundColor: '#ddd' },
  card: { width: '100%', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  meta: { color: '#555' },
  description: { marginTop: 8, fontSize: 16, color: '#222' },
  emotions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#fff', fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  controlButton: { alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 10, width: 100 },
  controlLabel: { color: '#fff', marginTop: 6 },
  backButton: { marginTop: 18, alignItems: 'center' },
  backText: { color: '#2563EB', fontWeight: '700' },
});