// app/scan/scanner.tsx
// Real-time art detection scanner using VisionCamera

import { announceOrSpeak, hapticImpact } from '@/app/accessibility';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { labelImage } from 'vision-camera-image-labeler';
import { runOnJS } from 'react-native-reanimated';

interface Props {
  mode: 'museum' | 'monuments' | 'landscape';
  onArtDetected: (imageUri: string) => void;
  onTimeout: () => void;
}

export default function ArtScanner({ mode, onArtDetected, onTimeout }: Props) {
  const router = useRouter();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanTime, setScanTime] = useState(0);
  const [detectedLabels, setDetectedLabels] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState(0);

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Art-related keywords to detect
  const artKeywords = [
    'painting', 'artwork', 'portrait', 'canvas', 'sculpture',
    'statue', 'monument', 'mural', 'fresco', 'drawing',
    'art', 'masterpiece', 'gallery', 'museum piece'
  ];

  const monumentKeywords = [
    'monument', 'building', 'architecture', 'landmark', 'tower',
    'statue', 'memorial', 'temple', 'cathedral', 'palace'
  ];

  const landscapeKeywords = [
    'landscape', 'mountain', 'valley', 'ocean', 'forest',
    'nature', 'scenery', 'vista', 'horizon', 'sky'
  ];

  // Get relevant keywords based on mode
  const getRelevantKeywords = () => {
    switch (mode) {
      case 'museum':
        return artKeywords;
      case 'monuments':
        return monumentKeywords;
      case 'landscape':
        return landscapeKeywords;
      default:
        return artKeywords;
    }
  };

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        announceOrSpeak(`Scanner ready. Slowly pan your camera around the ${mode} to detect artwork.`);
      } else {
        announceOrSpeak('Camera permission denied. Please enable camera access.');
      }
    })();
  }, [mode]);

  // Scan timer (40 seconds)
  useEffect(() => {
    if (!isScanning) return;

    // Update scan time every second
    scanIntervalRef.current = setInterval(() => {
      setScanTime(prev => {
        const newTime = prev + 1;
        
        // Announce progress every 10 seconds
        if (newTime % 10 === 0) {
          announceOrSpeak(`Scanning... ${40 - newTime} seconds remaining`);
        }
        
        return newTime;
      });
    }, 1000);

    // Timeout after 40 seconds
    scanTimeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, 40000);

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [isScanning]);

  // Handle detection callback (called from frame processor)
  const handleDetection = useCallback(
    (labels: Array<{ label: string; confidence: number }>) => {
      const relevantKeywords = getRelevantKeywords();
      
      // Check if any detected label matches our keywords
      const matchedLabels = labels.filter(item => {
        const labelLower = item.label.toLowerCase();
        return relevantKeywords.some(keyword => 
          labelLower.includes(keyword)
        ) && item.confidence > 0.6; // Require 60% confidence
      });

      if (matchedLabels.length > 0) {
        const maxConfidence = Math.max(...matchedLabels.map(l => l.confidence));
        setConfidenceLevel(maxConfidence);
        setDetectedLabels(matchedLabels.map(l => l.label));

        // If high confidence (>75%), auto-capture
        if (maxConfidence > 0.75 && isScanning) {
          hapticImpact('heavy');
          announceOrSpeak(`${mode} detected with ${Math.round(maxConfidence * 100)}% confidence. Capturing...`);
          handleCapture();
        }
      }
    },
    [mode, isScanning]
  );

  // Frame processor for real-time detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    try {
      const labels = labelImage(frame);
      
      // Run detection callback on JS thread
      if (labels && labels.length > 0) {
        runOnJS(handleDetection)(labels);
      }
    } catch (error) {
      console.error('Frame processor error:', error);
    }
  }, [handleDetection]);

  // Capture photo when art is detected
  const handleCapture = async () => {
    if (!camera.current || !isScanning) return;

    try {
      setIsScanning(false);
      
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      const imageUri = `file://${photo.path}`;
      
      announceOrSpeak('Photo captured. Starting analysis...');
      onArtDetected(imageUri);

    } catch (error) {
      console.error('Capture error:', error);
      announceOrSpeak('Failed to capture photo. Please try again.');
      setIsScanning(true);
    }
  };

  // Handle scan timeout
  const handleTimeout = () => {
    setIsScanning(false);
    announceOrSpeak('Scan timeout. No artwork detected. Please upload or take a photo manually.');
    hapticImpact('medium');
    onTimeout();
  };

  // Manual capture (fallback)
  const handleManualCapture = async () => {
    announceOrSpeak('Taking manual photo...');
    await handleCapture();
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <Text style={styles.errorSubtext}>Please enable camera access in settings</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScanning}
        photo={true}
        frameProcessor={frameProcessor}
      />

      {/* Scanning Overlay */}
      {isScanning && (
        <>
          {/* Scan Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Status Info */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Scanning for {mode}...
            </Text>
            <Text style={styles.timerText}>
              {40 - scanTime}s remaining
            </Text>
            
            {detectedLabels.length > 0 && (
              <View style={styles.detectionBox}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.detectionText}>
                  Detected: {detectedLabels[0]}
                </Text>
                <Text style={styles.confidenceText}>
                  {Math.round(confidenceLevel * 100)}%
                </Text>
              </View>
            )}
          </View>

          {/* Instruction Banner */}
          <View style={styles.instructionBanner}>
            <MaterialIcons name="camera" size={24} color="#fff" />
            <Text style={styles.instructionText}>
              Slowly pan camera around the area
            </Text>
          </View>
        </>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Cancel scanning"
        >
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {isScanning && (
          <TouchableOpacity
            style={styles.manualCaptureButton}
            onPress={handleManualCapture}
            accessibilityLabel="Take manual photo"
          >
            <MaterialIcons name="camera" size={32} color="#fff" />
            <Text style={styles.manualCaptureText}>Manual Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '25%',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  statusContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerText: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  detectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  detectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
  },
  instructionBanner: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 12,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCaptureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  manualCaptureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
