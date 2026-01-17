import { analyzeImage } from '../utils/AnalyzeImage';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as 'museum' | 'monuments' | 'landscape') || 'museum';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const modeColor =
    mode === 'museum' ? '#3B82F6' :
    mode === 'monuments' ? '#A0522D' : '#16A34A';

  // 📸 Pick an image from the gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery access is required to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 📷 Take a photo with the device camera (uses native camera UI)
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    } else if ((result as any).uri) {
      // older shape
      setImageUri((result as any).uri);
    }
  };

  // 🧠 Analyze the selected image
  const handleAnalyze = async () => {
    if (!imageUri) return;
    try {
      setIsProcessing(true);
      const result = await analyzeImage(imageUri, mode);
      router.push({ pathname: '/result', params: { ...result, mode } } as any);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to analyze image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Preview Section */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={[styles.placeholder, { borderColor: modeColor }]}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      {/* Loader Overlay */}
      {isProcessing && (
        <View style={styles.loaderOverlay} accessible accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={modeColor} />
          <Text style={styles.loaderText}>Analyzing image...</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open image gallery"
          style={styles.secondaryButton}
          onPress={pickImage}
        >
          <MaterialIcons name="photo-library" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Take a photo"
          style={[styles.captureButton, { borderColor: modeColor }]}
          onPress={takePhoto}
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={styles.secondaryButton}
          onPress={() => router.replace('/')}
        >
          <MaterialIcons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Analyze Button */}
      {imageUri && !isProcessing && (
        <TouchableOpacity
          style={[styles.analyzeButton, { backgroundColor: modeColor }]}
          onPress={handleAnalyze}
        >
          <Text style={styles.analyzeText}>Analyze Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, width: '100%', resizeMode: 'contain' },
  placeholder: {
    flex: 1,
    margin: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#aaa', fontSize: 18 },
  controls: {
    height: 100,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    backgroundColor: '#fff',
  },
  analyzeButton: {
    alignSelf: 'center',
    marginBottom: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  analyzeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: { color: '#fff', marginTop: 12, fontSize: 18 },
});