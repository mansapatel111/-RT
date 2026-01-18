import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { announceForAccessibility, initAccessibility, loadSettings, setDefaultSpeechSettings } from './accessibility';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Hide headers globally so no top breadcrumb/tab shows for each route */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Initialize accessibility (load persisted settings and screen-reader state) */}
      {/* run once on mount */}
      <InitAccessibility />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function InitAccessibility() {
  useEffect(() => {
    (async () => {
      try {
        await initAccessibility();
        // announce that app is ready for accessibility
        announceForAccessibility('App ready');
        const settings = await loadSettings();
        if (settings) {
          setDefaultSpeechSettings({ rate: settings.ttsSpeed, pitch: settings.ttsPitch });
        }
      } catch {
        // ignore init errors
      }
    })();
  }, []);

  return null;
}
