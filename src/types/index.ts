import { StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Text, View } from '@/components/Themed';
import playlistService from '../../src/services/playlistService';
import { PlaylistMetadata } from '../../src/types';

export default function TabOneScreen() {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlaylists = useCallback(async () => {
    try {
      const metadata = await playlistService.getPlaylistsMetadata();
      setPlaylists(metadata);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlaylists();
    setRefreshing(false);
  }, [loadPlaylists]);

  const handleTestPlaylist = () => {
    Alert.alert(
      '🧪 Test Playlist Loading',
      'Load a test playlist to verify URL handling works?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Test',
          onPress: async () => {
            try {
              // Simulera en test playlist med mer innehåll
              const testPlaylist = {
                playlistId: 'test-hamlet-001',
                theaterName: 'Dramaten Test',
                showName: 'Hamlet (Demo)',
                version: '1.0.0',
                bleUUID: '550e8400-e29b-41d4-a716-446655440000',
                checksum: '',
                cues: [
                  {
                    id: '1.1',
                    actions: [
                      {
                        type: 'tts' as const,
                        text: 'Hamlet går in på scenen från höger. Han bär sin svarta mantel och ser djupt eftertänksam ut.',
                        language: 'sv-SE',
                        delay: 0
                      }
                    ]
                  },
                  {
                    id: '1.2',
                    actions: [
                      {
                        type: 'tts' as const,
                        text: 'Hamlet börjar sin berömda monolog: Att vara eller inte vara, det är frågan.',
                        language: 'sv-SE',
                        delay: 0
                      }
                    ]
                  },
                  {
                    id: '1.3',
                    actions: [
                      {
                        type: 'tts' as const,
                        text: 'Ophelia kommer in från vänster, hon verkar orolig och söker efter Hamlet.',
                        language: 'sv-SE',
                        delay: 0
                      }
                    ]
                  },
                  {
                    id: '2.1',
                    actions: [
                      {
                        type: 'tts' as const,
                        text: 'Scen två: Kungliga salen. Claudius sitter på tronen, omgiven av hovfolk.',
                        language: 'sv-SE',
                        delay: 0
                      }
                    ]
                  },
                  {
                    id: '2.2',
                    actions: [
                      {
                        type: 'tts' as const,
                        text: 'Claudius reser sig och börjar sitt tal till hovfolket om rikets tillstånd.',
                        language: 'sv-SE',
                        delay: 0
                      }
                    ]
                  }
                ],
                mediaFiles: [],
                createdAt: new Date().toISOString()
              };

              // Använd playlistService istället för direkt sparande
              await playlistService.savePlaylist(testPlaylist);
              await loadPlaylists();
              Alert.alert('✅ Success', 'Test playlist loaded!\n\nTap on the playlist below to set it as active, then go to the Simulator tab to test cues.');
            } catch (error) {
              Alert.alert('❌ Error', `Failed: ${error}`);
            }
          }
        }
      ]
    );
  };

  // Ny funktion för att sätta aktiv playlist
  const handleSetAsActive = async (playlistId: string) => {
    try {
      const playlist = await playlistService.getPlaylist(playlistId);
      if (playlist) {
        playlistService.setCurrentPlaylist(playlist);
        Alert.alert(
          '✅ Playlist Activated', 
          `"${playlist.showName}" is now the active playlist.\n\nGo to the Simulator tab to test cues!`,
          [
            { text: 'OK' },
            { text: 'Open Simulator', onPress: () => {
              // Detta skulle navigera till simulator tab om vi hade navigation
              console.log('Navigate to simulator tab');
            }}
          ]
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to set active playlist: ${error}`);
    }
  };

  // Ny funktion för att ta bort playlist
  const handleDeletePlaylist = (playlistId: string, showName: string) => {
    Alert.alert(
      '🗑️ Delete Playlist',
      `Are you sure you want to delete "${showName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistService.deletePlaylist(playlistId);
              await loadPlaylists();
              Alert.alert('✅ Deleted', 'Playlist removed successfully');
            } catch (error) {
              Alert.alert('❌ Error', `Failed to delete: ${error}`);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={styles.title}>🎭 Theater Accessibility</Text>
        <Text style={styles.subtitle}>Playlists & Cue Management</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Saved Playlists ({playlists.length})</Text>
          
          {playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No playlists loaded yet</Text>
              <Text style={styles.emptySubtext}>
                Load a test playlist below or scan a QR code from a theater
              </Text>
            </View>
          ) : (
            playlists.map((playlist) => (
              <View key={playlist.playlistId} style={styles.playlistCard}>
                <TouchableOpacity 
                  style={styles.playlistContent}
                  onPress={() => handleSetAsActive(playlist.playlistId)}
                >
                  <Text style={styles.playlistTitle}>{playlist.showName}</Text>
                  <Text style={styles.playlistTheater}>{playlist.theaterName}</Text>
                  <Text style={styles.playlistDate}>
                    Downloaded: {new Date(playlist.downloadedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.tapHint}>👆 Tap to set as active playlist</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeletePlaylist(playlist.playlistId, playlist.showName)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Testing</Text>
          <Text style={styles.instructionText}>
            Load a test playlist to try out the cue simulator and TTS functionality.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTestPlaylist}>
            <Text style={styles.buttonText}>🧪 Load Test Playlist</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 URL Scheme</Text>
          <Text style={styles.instructionText}>
            Example URL: theateraccess://playlist?url=https://example.com/hamlet.json
          </Text>
          <Text style={styles.instructionText}>
            When theaters send you a link or QR code, it will automatically open this app and load the playlist.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            1. Theater sends you a playlist link or QR code{'\n'}
            2. App downloads and validates playlist security{'\n'}
            3. Set playlist as active (tap on it above){'\n'}
            4. Go to Simulator tab to test cues{'\n'}
            5. In theater: BLE receives cues automatically{'\n'}
            6. Actions execute (audio description, subtitles, etc.)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyState: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  playlistCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  playlistContent: {
    flex: 1,
    padding: 16,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#24292e',
  },
  playlistTheater: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
    color: '#586069',
  },
  playlistDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
    color: '#6a737d',
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
    color: '#007AFF',
  },
  deleteButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
});