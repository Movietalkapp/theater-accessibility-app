// components/TheaterModeScreen.tsx
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, StatusBar, View, Text } from 'react-native';
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

  // Aktivera BLE/mock lyssning endast om show är aktiv
  useBleCueListener(onCueTrigger, !!currentShow);

  return (
    <View style={styles.theaterScreen}>
      <StatusBar hidden />

      {/* Fullskärms touch-area för långtryck */}
      <TouchableOpacity
        style={styles.fullScreenTouch}
        onPressIn={onLongPressStart}
        onPressOut={onLongPressEnd}
        activeOpacity={1}
        accessible={!showExitDialog}
        accessibilityLabel={`Lyssningsläge för ${currentShow?.showName}. Tryck två gånger och håll för att stoppa.`}
        accessibilityHint="Dubbelknacka och håll kvar fingret för att visa alternativ för att stoppa föreställningen"
        accessibilityRole="button"
      />

      {/* Minimal lyssnar-indikator */}
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

      {/* CENTRERAT INNEHÅLL: Infotext → ikon → showName */}
      {currentShow?.showName && (
        <View style={styles.centerContainer} pointerEvents="none" accessible={false}>
          <Text style={styles.infoText}>
            Stäng inte av enheten eller lås skärmen under föreställningen.
          </Text>
          <FontAwesome
            name="play-circle"
            size={92}
            color="#ffe066"
            style={styles.playIcon}
          />
          <Text style={styles.showNameText}>{currentShow.showName}</Text>
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
    width: 4,
    height: 4,
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
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -92 }], // Justerar så hela blocket hamnar mitt i rutan
  },
  infoText: {
    color: '#ffe066',
    opacity: 0.36,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  playIcon: {
    opacity: 0.35,
    marginBottom: 14,
  },
  showNameText: {
    color: '#ffe066',
    opacity: 0.29,
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginTop: 4,
  },
});
