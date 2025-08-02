// components/TheaterModeScreen.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { View } from '@/components/Themed';
import { Playlist } from '../src/types';
import ExitDialog from './ExitDialog';

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

      {/* Minimal lyssnar-indikator - mycket svag */}
      <View style={styles.listeningIndicator} accessible={false}>
        <View style={styles.listeningDot} accessible={false} />
      </View>

      {/* Långtryck progress - bara synlig under tryck */}
      {longPressProgress > 0 && (
        <View style={styles.progressContainer} accessible={false}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${longPressProgress}%` }]} />
          </View>
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
});