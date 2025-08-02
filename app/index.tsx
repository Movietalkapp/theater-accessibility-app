// app/index.tsx
import { Stack } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, StatusBar, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAccessibility } from '../hooks/useAccessibility';
import { usePlaylists } from '../hooks/usePlaylists';
import { useTheaterMode } from '../hooks/useTheaterMode';
import TheaterModeScreen from '../components/TheaterModeScreen';
import PlaylistList from '../components/PlaylistList';
import StartModal from '../components/StartModal'; // <-- Lägg till denna rad!

export default function StageTalkScreen() {
  const navigation = useNavigation();

  // Custom hooks
  const { 
    isVoiceOverRunning, 
    announceForAccessibility, 
    setAccessibilityFocus 
  } = useAccessibility();

  const { 
    playlists, 
    loadPlaylists, 
    deletePlaylist 
  } = usePlaylists(announceForAccessibility);

  const {
    theaterMode,
    currentShow,
    showExitDialog,
    longPressProgress,
    startShow,
    exitTheaterMode,
    cancelExit,
    handleLongPressStart,
    handleLongPressEnd,
  } = useTheaterMode({
    announceForAccessibility,
    setAccessibilityFocus,
    isVoiceOverRunning,
    navigation,
  });

  // Nytt state för startmodal
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Ladda playlists när screen fokuseras
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [loadPlaylists])
  );

  // Hantera start från listan: öppna startmodal först
  const handleStartShow = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowStartModal(true);
  };

  // När användaren trycker "Start" i modal: starta show och stäng modal
  const handleModalStart = () => {
    if (selectedPlaylistId) {
      startShow(selectedPlaylistId);
    }
    setShowStartModal(false);
    setSelectedPlaylistId(null);
  };

  // Om man avbryter startmodalen: stäng modal
  const handleModalCancel = () => {
    setShowStartModal(false);
    setSelectedPlaylistId(null);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'StageTalk' }} />
      {/* StartModal visas bara när man valt en föreställning */}
      <StartModal
        visible={showStartModal}
        onStart={handleModalStart}
        onCancel={handleModalCancel}
      />
      {theaterMode ? (
        <TheaterModeScreen
          currentShow={currentShow}
          showExitDialog={showExitDialog}
          longPressProgress={longPressProgress}
          onLongPressStart={handleLongPressStart}
          onLongPressEnd={handleLongPressEnd}
          onExit={exitTheaterMode}
          onCancel={cancelExit}
        />
      ) : (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <Text
            style={styles.instruction}
            accessible={true}
            accessibilityRole="header"
          >
            Välj föreställning
          </Text>
          <PlaylistList
            playlists={playlists}
            onStartShow={handleStartShow}
            onDeletePlaylist={deletePlaylist}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  instruction: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333333',
    fontWeight: '500',
  },
});
