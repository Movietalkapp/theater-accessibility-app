import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, StatusBar, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAccessibility } from '../hooks/useAccessibility';
import { usePlaylists } from '../hooks/usePlaylists';
import { useTheaterMode } from '../hooks/useTheaterMode';
import TheaterModeScreen from '../components/TheaterModeScreen';
import PlaylistList from '../components/PlaylistList';

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

  // Ladda playlists när screen fokuseras
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [loadPlaylists])
  );

  // Titlebar: StageTalk
  // Denna rad MÅSTE ligga överst i return!
  // Annars används default-titeln (t.ex. 'index')
  // och inte din egna.
  return (
    <>
      <Stack.Screen options={{ title: 'StageTalk' }} />
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
            onStartShow={startShow}
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
