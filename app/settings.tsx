import VOPressable from '@/components/vo-pressable';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { announceOrSpeak, hapticImpact, loadSettings, saveSettings, setDefaultSpeechSettings, speak } from './accessibility';

export default function SettingsScreen() {
  const router = useRouter();
  const DEFAULT_RATE = 0.85;
  const DEFAULT_PITCH = 1.0;
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH);
  // When true the app provides in-app TTS controls. We reuse the existing persisted
  // `matchVoiceOver` key for backwards compatibility (older installs may have stored it).
  const [enableTTS, setEnableTTS] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);

  // Play a simple click sound for button feedback
  const playClickSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==' },
        { shouldPlay: true, volume: 0.3 }
      );
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Ignore sound errors
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const settings = await loadSettings();
        if (settings) {
          setRate(settings.ttsSpeed ?? DEFAULT_RATE);
          setPitch(settings.ttsPitch ?? DEFAULT_PITCH);
          // previously stored as `matchVoiceOver` — treat presence as "enable TTS"
          setEnableTTS(settings.matchVoiceOver ?? true);
          setDefaultSpeechSettings({ rate: settings.ttsSpeed ?? DEFAULT_RATE, pitch: settings.ttsPitch ?? DEFAULT_PITCH });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        // Announce after settings are loaded
        setTimeout(() => {
          announceOrSpeak('Accessibility Settings. Customize text-to-speech and haptic feedback.');
        }, 300);
      }
    })();
  }, []);

  const persist = async () => {
    hapticImpact('medium');
    playClickSound();
    setLoading(true);
    try {
      await saveSettings(rate, pitch, enableTTS, false);
      setDefaultSpeechSettings({ rate, pitch });
      if (enableTTS) speak('Accessibility settings saved');
      setShowSavedModal(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTTS = async (value: boolean) => {
    setEnableTTS(value);
    hapticImpact('light');
    playClickSound();
    
    // Save immediately when TTS is toggled
    try {
      await saveSettings(rate, pitch, value, false);
      if (value) {
        speak('Text to speech enabled');
      } else {
        // Use native speech API directly to announce even when TTS is being disabled
        speak('Text to speech disabled');
      }
    } catch {
      // ignore
    }
  };

  const adjustRate = (delta: number) => {
    hapticImpact('light');
    playClickSound();
    setRate((r) => {
      const newRate = Math.max(0.3, Math.min(2.0, +(r + delta).toFixed(2)));
      return newRate;
    });
  };

  const adjustPitch = (delta: number) => {
    hapticImpact('light');
    playClickSound();
    setPitch((p) => {
      const newPitch = Math.max(0.5, Math.min(2.0, +(p + delta).toFixed(2)));
      return newPitch;
    });
  };

  const resetDefaults = () => {
    hapticImpact('light');
    playClickSound();
    setRate(DEFAULT_RATE);
    setPitch(DEFAULT_PITCH);
    setEnableTTS(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Accessibility' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.topBar}>
            <VOPressable onPress={() => {
              hapticImpact('light');
              playClickSound();
              router.back();
            }} accessibilityLabel="Back" containerStyle={styles.backButton}>
              <MaterialIcons name="arrow-back" size={20} color="#0b1220" />
            </VOPressable>
            <Text style={styles.header}>Accessibility Settings</Text>
          </View>

          <Text style={styles.lead}>Customize text-to-speech and haptic feedback. Tap once to hear a label, tap again to activate when VoiceOver is off.</Text>

          <View style={[styles.card, styles.rowBetween]}> 
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Enable TTS</Text>
              <Text style={styles.cardDesc}>Toggle in-app text-to-speech. When disabled, TTS will not be spoken but controls remain visible.</Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Switch value={enableTTS} onValueChange={handleToggleTTS} accessibilityLabel="Enable TTS" />
              <VOPressable
                containerStyle={[styles.secondaryButton, !enableTTS ? styles.disabledButton : null, { paddingHorizontal: 12, paddingVertical: 8 }]}
                onPress={() => {
                  hapticImpact('light');
                  playClickSound();
                  speak('This is a test of the accessibility voice settings');
                }}
                accessibilityLabel="Test voice"
                disabled={!enableTTS}
              >
                <Text style={[styles.secondaryText, !enableTTS ? { opacity: 0.6 } : null]}>Test voice</Text>
              </VOPressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>TTS Speed</Text>
            <View style={styles.rowControl}>
              <VOPressable accessibilityLabel="Decrease speed" containerStyle={[styles.smallButton, !enableTTS ? styles.disabledButton : null]} onPress={() => adjustRate(-0.05)} disabled={!enableTTS}>
                <Text style={styles.smallBtnText}>–</Text>
              </VOPressable>
              <Text style={styles.metric}>{rate.toFixed(2)}</Text>
              <VOPressable accessibilityLabel="Increase speed" containerStyle={[styles.smallButton, !enableTTS ? styles.disabledButton : null]} onPress={() => adjustRate(0.05)} disabled={!enableTTS}>
                <Text style={styles.smallBtnText}>+</Text>
              </VOPressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>TTS Pitch</Text>
            <View style={styles.rowControl}>
              <VOPressable accessibilityLabel="Decrease pitch" containerStyle={[styles.smallButton, !enableTTS ? styles.disabledButton : null]} onPress={() => adjustPitch(-0.05)} disabled={!enableTTS}>
                <Text style={styles.smallBtnText}>–</Text>
              </VOPressable>
              <Text style={styles.metric}>{pitch.toFixed(2)}</Text>
              <VOPressable accessibilityLabel="Increase pitch" containerStyle={[styles.smallButton, !enableTTS ? styles.disabledButton : null]} onPress={() => adjustPitch(0.05)} disabled={!enableTTS}>
                <Text style={styles.smallBtnText}>+</Text>
              </VOPressable>
            </View>
          </View>

          <View style={styles.actions}>
            <VOPressable containerStyle={[styles.primaryButton, loading ? styles.disabledButton : null]} onPress={persist} accessibilityLabel="Save settings" disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Saving...' : 'Save Settings'}</Text>
            </VOPressable>

            <VOPressable containerStyle={styles.resetButton} onPress={resetDefaults} accessibilityLabel="Reset to defaults">
              <Text style={styles.resetText}>Reset to defaults</Text>
            </VOPressable>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSavedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="check-circle" size={48} color="#16A34A" />
            <Text style={styles.modalTitle}>Settings Saved</Text>
            <Text style={styles.modalMessage}>Your accessibility settings have been saved successfully.</Text>
            <VOPressable
              containerStyle={styles.modalButton}
              onPress={() => {
                hapticImpact('light');
                playClickSound();
                setShowSavedModal(false);
              }}
              accessibilityLabel="Close notification"
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </VOPressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7fafc' },
  scroll: { padding: 18, paddingBottom: 48 },
  container: { flex: 1, padding: 18, backgroundColor: '#f7fafc' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  header: { fontSize: 20, fontWeight: '800', color: '#0b1220' },
  lead: { color: '#334155', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0b1220' },
  cardDesc: { color: '#6b7280', marginTop: 4 },
  rowControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 12 },
  smallButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  metric: { fontSize: 18, fontWeight: '800', color: '#0b1220', minWidth: 72, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { marginTop: 18 },
  primaryButton: { backgroundColor: '#0b1220', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 10 },
  secondaryText: { color: '#0b1220', fontWeight: '700' },
  resetButton: { alignItems: 'center', paddingVertical: 10 },
  resetText: { color: '#6b7280' },
  disabledButton: { opacity: 0.6 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0b1220', marginTop: 12, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  modalButton: { backgroundColor: '#0b1220', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
