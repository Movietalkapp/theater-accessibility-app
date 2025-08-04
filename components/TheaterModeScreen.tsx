// components/TheaterModeScreen.tsx
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, StatusBar, View, Text, Image } from 'react-native';
import { Playlist } from '../src/types';
import ExitDialog from './ExitDialog';
import * as Speech from 'expo-speech';
import { useBleCueListener } from '../hooks/useBleCueListener';
import { FontAwesome } from '@expo/vector-icons';

interface TheaterModeScreenProps {
  currentShow: Playlist | null;
  showExitDialog: boolean;
  longPressProgress: number;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  onExit: () => void;
  onCancel: () => void;
}

export default function TheaterModeScreen({
  currentShow,
  showExitDialog,
  longPressProgress,
  onLongPressStart,
  onLongPressEnd,
  onExit,
  onCancel,
}: TheaterModeScreenProps) {
  // Cue-trigger callback (triggas från BLE/mock)
  const onCueTrigger = useCallback(
    (cueId: string) => {
      if (!currentShow) return;
      const cue = currentShow.cues.find(c => c.id === cueId);
      if (cue) {
        cue.actions?.forEach(action => {
          if (action.type === 'tts' && action.text) {
            Speech.speak(action.text, { language: action.language || 'sv-SE' });
          }
        });
      }
    },
    [currentShow]
  );

  useBleCueListener(onCueTrigger, !!currentShow, currentShow?.bleUUID);



  return (
    <View style={styles.theaterScreen}>
      <StatusBar hidden />
      <TouchableOpacity
        style={styles.fullScreenTouch}
        onPressIn={onLongPressStart}
        onPressOut={onLongPressEnd}
        activeOpacity={1}
        accessible={true}
        accessibilityLabel={currentShow?.showName ?? "Föreställning aktiv"}
        accessibilityRole="button"
      />

      {/* Lyssnar-indikator */}
      <View style={styles.listeningIndicator} accessible={false}>
        <View style={styles.listeningDot} accessible={false} />
      </View>

      {/* Långtryck progress */}
      {longPressProgress > 0 && (
        <View style={styles.progressContainer} accessible={false}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${longPressProgress}%` }]} />
          </View>
        </View>
      )}

      {/* CENTRERAT INNEHÅLL ÖVRE HALVAN */}
      {currentShow?.showName && (
        <View style={styles.centerContainer} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
          <Text accessible={false} style={styles.showNameText}>{currentShow.showName}</Text>
          <Image
            source={require('../assets/images/stagetalk_bg.png')}
            style={styles.centerImage}
            accessible={false}
            resizeMode="contain"
          />
        </View>
      )}

      {/* EXIT DIALOG */}
      <ExitDialog
        visible={showExitDialog}
        onExit={onExit}
        onCancel={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  theaterScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenTouch: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listeningIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  listeningDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#00ff00',
    opacity: 0.3,
  },
  progressContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -12 }],
  },
  progressBar: {
    width: 100,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  centerContainer: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none', // Blockar ej tryck
  },
  playIcon: {
    opacity: 0.36,
    marginBottom: 16,
  },
  showNameText: {
    color: '#ab1613',
    opacity: 0.36,
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginBottom: 15,
  },
  // [id: styles-centerImage]
  centerImage: {
    width: 200, // Justera efter behov
    height: 200 * (940 / 807),
    opacity: 0.3,
    marginBottom: 16,
  },
});
