import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { AccessibilityInfo, Platform } from 'react-native';

const SETTINGS_KEY = '@app_accessibility_settings';

type TTSSettings = {
  rate: number;
  pitch: number;
  matchVoiceOver?: boolean;
};

let isScreenReaderEnabled = false;
let isTTSEnabled = true; // Controls whether in-app TTS is enabled
let shouldMatchVoiceOver = false; // Whether to auto-match VoiceOver settings
let defaultTTSSettings: TTSSettings = {
  rate: 0.85,
  pitch: 1.0,
};

// VoiceOver typically uses these settings
const VOICEOVER_DEFAULTS = {
  rate: 0.5, // VoiceOver default speed is typically around 50%
  pitch: 1.0,
};

async function init() {
  try {
    // load settings from storage if available
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      defaultTTSSettings.rate = parsed.ttsSpeed ?? defaultTTSSettings.rate;
      defaultTTSSettings.pitch = parsed.ttsPitch ?? defaultTTSSettings.pitch;
      isTTSEnabled = parsed.matchVoiceOver ?? true;
      shouldMatchVoiceOver = parsed.shouldMatchVoiceOver ?? false;
    }
  } catch (e) {
    // ignore - proceed with defaults
    console.warn('Accessibility init: failed to load settings', e);
  }

  try {
    const enabled = await AccessibilityInfo.isScreenReaderEnabled();
    isScreenReaderEnabled = enabled;
    
    // If VoiceOver is on and user wants to match it, apply VoiceOver defaults
    if (enabled && shouldMatchVoiceOver) {
      defaultTTSSettings.rate = VOICEOVER_DEFAULTS.rate;
      defaultTTSSettings.pitch = VOICEOVER_DEFAULTS.pitch;
    }
  } catch {
    isScreenReaderEnabled = false;
  }

  // listen for changes
  try {
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled: boolean) => {
      isScreenReaderEnabled = enabled;
      
      // Auto-adjust settings when VoiceOver state changes
      if (enabled && shouldMatchVoiceOver) {
        defaultTTSSettings.rate = VOICEOVER_DEFAULTS.rate;
        defaultTTSSettings.pitch = VOICEOVER_DEFAULTS.pitch;
      }
    });
  } catch {
    // some RN versions use different APIs; swallow errors
  }
}

function getScreenReaderEnabled() {
  return isScreenReaderEnabled;
}

function getTTSEnabled() {
  return isTTSEnabled;
}

function getShouldMatchVoiceOver() {
  return shouldMatchVoiceOver;
}

function setDefaultSpeechSettings(settings: Partial<TTSSettings>) {
  if (settings.rate !== undefined) defaultTTSSettings.rate = settings.rate;
  if (settings.pitch !== undefined) defaultTTSSettings.pitch = settings.pitch;
}

async function speak(text: string, options?: Partial<Speech.SpeechOptions>) {
  // Don't speak if TTS is disabled in settings
  if (!isTTSEnabled) {
    return;
  }

  (async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      let preferredVoice: any;

      if (Platform.OS === 'ios') {
        preferredVoice = voices.find((v: any) => v.name === 'Ava') ||
          voices.find((v: any) => v.name === 'Zoe') ||
          voices.find((v: any) => v.name === 'Samantha') ||
          voices.find((v: any) => v.name === 'Nicky');
      } else {
        preferredVoice = voices.find((v: any) => (v.identifier || '').includes('en-us-x-')) || voices.find((v: any) => (v.quality === 'Enhanced'));
      }

      // If the platform is iOS and a screen reader is enabled, configure the audio
      // session so the app's TTS can mix with VoiceOver instead of replacing it.
      // This uses expo-av's Audio.setAudioModeAsync to request mixing behaviour.
      try {
        if (Platform.OS === 'ios' && isScreenReaderEnabled) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });
        } else if (Platform.OS === 'android') {
          // On Android prefer ducking so system speech can be heard alongside app audio.
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (audioErr) {
        // Non-fatal: if setting audio mode fails, continue and try to speak normally.
        console.warn('AccessibilityService: failed to set audio mode for TTS mixing', audioErr);
      }

      await Speech.stop();
      Speech.speak(text, {
        voice: preferredVoice?.identifier,
        language: 'en-US',
        pitch: options?.pitch ?? defaultTTSSettings.pitch,
        rate: options?.rate ?? defaultTTSSettings.rate,
        ...(options as any),
      });
    } catch {
      console.warn('AccessibilityService.speak error');
      try { await Speech.stop(); } catch {}
      try { Speech.speak(text); } catch {}
    }
  })();
}

function announceForAccessibility(text: string) {
  try {
    AccessibilityInfo.announceForAccessibility(text);
  } catch (e) {
    console.warn('announceForAccessibility error', e);
  }
}

function announceOrSpeak(text: string, speakOptions?: Partial<Speech.SpeechOptions>) {
  if (isScreenReaderEnabled) {
    // When VoiceOver/TalkBack is on, use native announcements
    announceForAccessibility(text);
  } else if (isTTSEnabled) {
    // When screen reader is off and TTS is enabled, use custom TTS
    speak(text, speakOptions);
  }
  // If both are disabled, do nothing
}

async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    const mapping: any = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(mapping[style]);
  } catch (e) {
    console.warn('hapticImpact error', e);
  }
}

async function saveSettings(rate: number, pitch: number, matchVoiceOver = false, syncWithVoiceOver = false) {
  try {
    const payload = { 
      ttsSpeed: rate, 
      ttsPitch: pitch, 
      matchVoiceOver,
      shouldMatchVoiceOver: syncWithVoiceOver 
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    setDefaultSpeechSettings({ rate, pitch });
    isTTSEnabled = matchVoiceOver; // Update the runtime flag
    shouldMatchVoiceOver = syncWithVoiceOver;
    
    // If syncing with VoiceOver and it's currently enabled, apply VoiceOver defaults
    if (syncWithVoiceOver && isScreenReaderEnabled) {
      defaultTTSSettings.rate = VOICEOVER_DEFAULTS.rate;
      defaultTTSSettings.pitch = VOICEOVER_DEFAULTS.pitch;
    }
  } catch (e) {
    console.warn('saveSettings error', e);
  }
}

async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getVoiceOverDefaults() {
  return { ...VOICEOVER_DEFAULTS };
}

export default {
  init,
  getScreenReaderEnabled,
  getTTSEnabled,
  getShouldMatchVoiceOver,
  setDefaultSpeechSettings,
  speak,
  announceForAccessibility,
  announceOrSpeak,
  hapticImpact,
  saveSettings,
  loadSettings,
  getVoiceOverDefaults,
};

export {
    announceForAccessibility,
    announceOrSpeak,
    getScreenReaderEnabled, getShouldMatchVoiceOver, getTTSEnabled, getVoiceOverDefaults,
    hapticImpact,
    init as initAccessibility,
    loadSettings,
    saveSettings,
    setDefaultSpeechSettings,
    SETTINGS_KEY,
    speak
};

