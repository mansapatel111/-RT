// // app/scan/[mode].tsx
// import { announceOrSpeak } from '@/app/accessibility';
// import { analyzeImage } from '@/utils/analyzeImage';
// import { MaterialIcons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from 'react-native';

// export default function ScanScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const mode = (params.mode as 'museum' | 'monuments' | 'landscape') || 'museum';

//   const [imageUri, setImageUri] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progressMessage, setProgressMessage] = useState('');

//   // Announce when entering the mode
//   useEffect(() => {
//     const modeNames: Record<typeof mode, string> = {
//       museum: 'Museum Mode',
//       monuments: 'Monuments Mode',
//       landscape: 'Landscape Mode'
//     };
//     const modeName = modeNames[mode];
//     // Small delay to ensure settings are loaded and screen is mounted
//     const timer = setTimeout(() => {
//       announceOrSpeak(`You are now in ${modeName}. Upload or take a photo of artwork to begin.`);
//     }, 300);
    
//     return () => clearTimeout(timer);
//   }, [mode]);

//   // no pulsing animation — simplified capture UI

//   const modeColor =
//     mode === 'museum' ? '#3B82F6' :
//     mode === 'monuments' ? '#A0522D' : '#16A34A';

//   // 📸 Pick an image from the gallery
//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission required', 'Gallery access is required to select an image.');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets?.length > 0) {
//       setImageUri(result.assets[0].uri);
//     }
//   };

//   // 📷 Take a photo with the device camera
//   const takePhoto = async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission required', 'Camera access is required to take a photo.');
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
//     if (!result.canceled && result.assets?.length > 0) {
//       setImageUri(result.assets[0].uri);
//     } else if ((result as any).uri) {
//       setImageUri((result as any).uri);
//     }
//   };

//   // 🧠 Analyze the selected image
//   const handleAnalyze = async () => {
//     if (!imageUri) return;
    
//     try {
//       setIsProcessing(true);
      
//       if (mode === 'museum') {
//         // Museum mode has multiple steps
//         const msg1 = 'Converting image...';
//         setProgressMessage(msg1);
//         announceOrSpeak(msg1);
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         const msg2 = 'Getting painting metadata...';
//         setProgressMessage(msg2);
//         announceOrSpeak(msg2);
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         const msg3 = 'Analyzing historical context...';
//         setProgressMessage(msg3);
//         announceOrSpeak(msg3);
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         const msg4 = 'Creating immersive description...';
//         setProgressMessage(msg4);
//         announceOrSpeak(msg4);
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         const msg5 = 'Generating music, this may take 1 to 2 minutes...';
//         setProgressMessage(msg5);
//         announceOrSpeak(msg5);
//       } else {
//         const msg = 'Analyzing image...';
//         setProgressMessage(msg);
//         announceOrSpeak(msg);
//       }
      
//       const result = await analyzeImage(imageUri, mode);
      
//       const completeMsg = 'Image analysis complete!';
//       setProgressMessage(completeMsg);
//       announceOrSpeak(completeMsg);
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       router.push({ pathname: '/result', params: { ...result, mode } } as any);
      
//     } catch (error) {
//       console.error('Analysis error:', error);
//       const errorMsg = error instanceof Error ? error.message : 'Failed to analyze image. Please try again.';
//       announceOrSpeak(`Error: ${errorMsg}`);
//       Alert.alert('Analysis Failed', errorMsg);
//     } finally {
//       setIsProcessing(false);
//       setProgressMessage('');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* hint removed - UI simplified to focus on the capture button */}
//       {/* Preview Section */}
//       {imageUri ? (
//         <Image source={{ uri: imageUri }} style={styles.preview} />
//       ) : (
//         <View style={[styles.placeholder, { borderColor: modeColor }]}>
//           <MaterialIcons name="image" size={80} color={modeColor} />
//           <Text style={styles.placeholderText}>No image selected</Text>
//           <Text style={styles.placeholderSubtext}>
//             {mode === 'museum' ? 'Select a painting or artwork' :
//              mode === 'monuments' ? 'Select a monument or landmark' :
//              'Select a landscape or nature scene'}
//           </Text>
//         </View>
//       )}

//       {/* Loader Overlay */}
//       {isProcessing && (
//         <View style={styles.loaderOverlay} accessible accessibilityLiveRegion="polite">
//           <View style={styles.loaderCard}>
//             <ActivityIndicator size="large" color={modeColor} />
//             <Text style={styles.loaderTitle}>
//               {mode === 'museum' ? 'Analyzing Artwork' :
//                mode === 'monuments' ? 'Analyzing Monument' :
//                'Analyzing Landscape'}
//             </Text>
//             {progressMessage && (
//               <Text style={styles.loaderText}>{progressMessage}</Text>
//             )}
//             {mode === 'museum' && progressMessage.includes('music') && (
//               <Text style={styles.loaderSubtext}>
//                 Generating unique music based on the artwork&apos;s mood...
//               </Text>
//             )}
//           </View>
//         </View>
//       )}

//       {/* Controls */}
//       <View style={styles.controls}>
//         <TouchableOpacity
//           accessibilityRole="button"
//           accessibilityLabel="Open image gallery"
//           style={[styles.secondaryButton, { borderWidth: 2, borderColor: modeColor }]}
//           onPress={pickImage}
//           disabled={isProcessing}
//         >
//           <MaterialIcons name="photo-library" size={28} color="#fff" />
//         </TouchableOpacity>

//         <View style={styles.captureWrap}>
//           <TouchableOpacity
//             accessibilityRole="button"
//             accessibilityLabel="Take a photo"
//             style={[styles.captureButton, { borderColor: modeColor }]}
//             onPress={takePhoto}
//             disabled={isProcessing}
//         />
//           <Text style={styles.captureLabel}>Tap to capture</Text>
//         </View>

//         <TouchableOpacity
//           accessibilityRole="button"
//           accessibilityLabel="Back to home"
//           style={[styles.secondaryButton, { borderWidth: 2, borderColor: modeColor }]}
//           onPress={() => router.replace('/')}
//           disabled={isProcessing}
//         >
//           <MaterialIcons name="home" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Analyze Button */}
//       {imageUri && !isProcessing && (
//         <TouchableOpacity
//           style={[styles.analyzeButton, { backgroundColor: modeColor }]}
//           onPress={handleAnalyze}
//         >
//           <MaterialIcons name="auto-awesome" size={24} color="#fff" style={{ marginRight: 8 }} />
//           <Text style={styles.analyzeText}>Analyze Image</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#000' 
//   },
//   preview: { 
//     flex: 1, 
//     width: '100%', 
//     resizeMode: 'contain' 
//   },
//   placeholder: {
//     // occupy a centered area and visually overlay the controls so its dashed border sits above the buttons
//     position: 'absolute',
//     top: 80,
//     left: 20,
//     right: 20,
//     bottom: 170,
//     borderWidth: 2,
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 30,
//     elevation: 30,
//     backgroundColor: 'transparent',
//   },
//   placeholderText: { 
//     color: '#fff', 
//     fontSize: 20, 
//     marginTop: 16, 
//     fontWeight: '600' 
//   },
//   placeholderSubtext: { 
//     color: '#aaa', 
//     fontSize: 14, 
//     marginTop: 8, 
//     textAlign: 'center', 
//     paddingHorizontal: 40 
//   },
//   controls: {
//     height: 120,
//     backgroundColor: '#000',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-around',
//     padding: 12,
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 28, // lift controls a bit above the very bottom
//     zIndex: 0,
//   },
//   secondaryButton: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 0,
//   },
//   captureButton: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     borderWidth: 6,
//     backgroundColor: '#fff',
//     zIndex: 0,
//   },
//   captureWrap: {
//     width: 120,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   /* pulse removed */
//   captureLabel: {
//     marginTop: 8,
//     color: '#fff',
//     fontSize: 13,
//   },
//   /* hint removed */
//   analyzeButton: {
//     alignSelf: 'center',
//     marginBottom: 160,
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   analyzeText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   loaderOverlay: {
//     position: 'absolute',
//     top: 0, 
//     left: 0, 
//     right: 0, 
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.92)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loaderCard: {
//     backgroundColor: '#111',
//     padding: 32,
//     borderRadius: 16,
//     alignItems: 'center',
//     maxWidth: '85%',
//   },
//   loaderTitle: { 
//     color: '#fff', 
//     marginTop: 16, 
//     fontSize: 20, 
//     fontWeight: '700' 
//   },
//   loaderText: { 
//     color: '#aaa', 
//     marginTop: 12, 
//     fontSize: 16,
//     textAlign: 'center',
//   },
//   loaderSubtext: {
//     color: '#666',
//     marginTop: 8,
//     fontSize: 13,
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
// });





// app/scan/[mode].tsx
// Updated to include scanner option

import { announceOrSpeak } from '@/app/accessibility';
import { analyzeImage } from '@/utils/analyzeImage';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ArtScanner from './scanner';

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as 'museum' | 'monuments' | 'landscape') || 'museum';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const modeColor =
    mode === 'museum' ? '#3B82F6' :
    mode === 'monuments' ? '#A0522D' : '#16A34A';

  // Announce mode entry
  useEffect(() => {
    const modeMessages = {
      museum: 'Museum Mode. You can scan, upload, or take a photo of artwork.',
      monuments: 'Monuments Mode. Scan or capture historic landmarks.',
      landscape: 'Landscape Mode. Scan or photograph natural scenery.'
    };
    
    const timer = setTimeout(() => {
      announceOrSpeak(modeMessages[mode]);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [mode]);

  // 🔍 Open Scanner (NEW!)
  const openScanner = () => {
    announceOrSpeak('Opening scanner. Pan your camera slowly around the area to detect artwork.');
    setShowScanner(true);
  };

  // Handle successful detection from scanner
  const handleArtDetected = (uri: string) => {
    setShowScanner(false);
    setImageUri(uri);
    announceOrSpeak('Artwork detected! Ready to analyze.');
  };

  // Handle scanner timeout
  const handleScanTimeout = () => {
    setShowScanner(false);
    announceOrSpeak('No artwork detected. Please upload or take a photo manually.');
  };

  // 📸 Pick from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
      announceOrSpeak('Image selected from gallery');
    }
  };

  // 📷 Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
      announceOrSpeak('Photo captured');
    }
  };

  // 🧠 Analyze image
  const handleAnalyze = async () => {
    if (!imageUri) return;
    
    try {
      setIsProcessing(true);
      
      // Mode-specific progress messages
      const progressSteps = {
        museum: [
          'Converting image...',
          'Getting painting metadata...',
          'Analyzing historical context...',
          'Creating immersive description...',
          'Generating music, this may take 1 to 2 minutes...'
        ],
        monuments: [
          'Converting image...',
          'Identifying monument...',
          'Gathering historical information...',
          'Creating atmospheric description...',
          'Generating epic music, this may take 1 to 2 minutes...'
        ],
        landscape: [
          'Converting image...',
          'Analyzing landscape...',
          'Identifying natural features...',
          'Creating immersive scene description...',
          'Generating ambient music, this may take 1 to 2 minutes...'
        ]
      };

      for (const msg of progressSteps[mode]) {
        setProgressMessage(msg);
        announceOrSpeak(msg);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await analyzeImage(imageUri, mode);
      
      const completeMsg = 'Analysis complete!';
      setProgressMessage(completeMsg);
      announceOrSpeak(completeMsg);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push({ pathname: '/result', params: { ...result, mode } } as any);
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to analyze image.';
      announceOrSpeak(`Error: ${errorMsg}`);
      Alert.alert('Analysis Failed', errorMsg);
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ArtScanner
          mode={mode}
          onArtDetected={handleArtDetected}
          onTimeout={handleScanTimeout}
        />
      </Modal>

      {/* Preview */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={[styles.placeholder, { borderColor: modeColor }]}>
          <MaterialIcons name="image" size={80} color={modeColor} />
          <Text style={styles.placeholderText}>No image selected</Text>
          <Text style={styles.placeholderSubtext}>
            {mode === 'museum' ? 'Scan, select, or capture a painting' :
             mode === 'monuments' ? 'Scan, select, or capture a monument' :
             'Scan, select, or capture a landscape'}
          </Text>
        </View>
      )}

      {/* Loader */}
      {isProcessing && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={modeColor} />
            <Text style={styles.loaderTitle}>
              {mode === 'museum' ? 'Analyzing Artwork' :
               mode === 'monuments' ? 'Analyzing Monument' :
               'Analyzing Landscape'}
            </Text>
            {progressMessage && (
              <Text style={styles.loaderText}>{progressMessage}</Text>
            )}
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* NEW: Scanner Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open scanner to detect artwork"
          style={[styles.scannerButton, { backgroundColor: modeColor }]}
          onPress={openScanner}
          disabled={isProcessing}
        >
          <MaterialIcons name="document-scanner" size={28} color="#fff" />
          <Text style={styles.scannerText}>Scan</Text>
        </TouchableOpacity>

        {/* Gallery */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open image gallery"
          style={[styles.secondaryButton, { borderColor: modeColor }]}
          onPress={pickImage}
          disabled={isProcessing}
        >
          <MaterialIcons name="photo-library" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Camera */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Take a photo"
          style={[styles.captureButton, { borderColor: modeColor }]}
          onPress={takePhoto}
          disabled={isProcessing}
        />

        {/* Home */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={[styles.secondaryButton, { borderColor: modeColor }]}
          onPress={() => router.replace('/')}
          disabled={isProcessing}
        >
          <MaterialIcons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Analyze Button */}
      {imageUri && !isProcessing && (
        <TouchableOpacity
          style={[styles.analyzeButton, { backgroundColor: modeColor }]}
          onPress={handleAnalyze}
          accessibilityLabel={`Analyze ${mode} image`}
        >
          <MaterialIcons name="auto-awesome" size={24} color="#fff" />
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
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    bottom: 170,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#fff', fontSize: 20, marginTop: 16, fontWeight: '600' },
  placeholderSubtext: { color: '#aaa', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  controls: {
    height: 120,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
  },
  scannerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scannerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
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
    marginBottom: 160,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCard: {
    backgroundColor: '#111',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: '85%',
  },
  loaderTitle: { color: '#fff', marginTop: 16, fontSize: 20, fontWeight: '700' },
  loaderText: { color: '#aaa', marginTop: 12, fontSize: 16, textAlign: 'center' },
});
