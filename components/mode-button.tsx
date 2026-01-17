import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  label: string;
  subtitle?: string;
  color: string;
  iconName?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export default function ModeButton({ label, subtitle, color, iconName = 'photo', onPress, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, { backgroundColor: color }]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name={iconName as any} size={64} color="#fff" accessibilityIgnoresInvertColors />
      </View>
      <Text style={styles.label} accessibilityRole="text">{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 200,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    elevation: 3,
  },
  iconWrap: {
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 4,
  },
});