// app/(tabs)/two.tsx
import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import playlistService from '../../src/services/playlistService';
import CueSimulatorModal from '../../src/components/CueSimulatorModal';
import { Playlist } from '../../src/types';

export default function TabTwoScreen() {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [simulatorVisible, setSimulatorVisible] = useState(false);

  useEffect(() => {
    // Kolla om det finns en aktiv playlist
    const playlist = playlistService.getCurrentPlaylist();
    setCurrentPlaylist(playlist);
  }, []);

  const handleLoadPlaylist = async () => {
    try {
      const playlists = await playlistService.getPlaylistsMetadata();
      
      if (playlists.length === 0) {
        Alert.alert(
          'No Playlists', 
          'Load a playlist first from the Home tab',
          [{ text: 'OK' }]
        );
        return;
      }

      // Om bara en playlist, ladda den direkt
      if (playlists.length === 1) {
        const playlist = await playlistService.getPlaylist(playlists[0].playlistId);
        if (playlist) {
          playlistService.setCurrentPlaylist(playlist);
          setCurrentPlaylist(playlist);
          return;
        }
      }

      // Visa val av playlists
      const buttons = playlists.map(p => ({
        text: `${p.showName} (${p.theaterName})`,
        onPress: async () => {
          const playlist = await playlistService.getPlaylist(p.playlistId);
          if (playlist) {
            playlistService.setCurrentPlaylist(playlist);
            setCurrentPlaylist(playlist);
          }
        }
      }));
      
      buttons.push({ text: 'Cancel', onPress: () => {} });

      Alert.alert('Select Playlist', 'Choose a playlist to simulate:', buttons);
      
    } catch (error) {
      Alert.alert('Error', `Failed to load playlists: ${error}`);
    }
  };

  const openSimulator = () => {
    if (!currentPlaylist) {
      handleLoadPlaylist();
      return;
    }
    setSimulatorVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎭 Cue Simulator</Text>
      <Text style={styles.subtitle}>Test theater cues without BLE</Text>

      {currentPlaylist ? (
        <View style={styles.playlistInfo}>
          <Text style={styles.infoTitle}>📋 Active Playlist</Text>
          <View style={styles.playlistCard}>
            <Text style={styles.playlistTitle}>{currentPlaylist.showName}</Text>
            <Text style={styles.playlistTheater}>{currentPlaylist.theaterName}</Text>
            <Text style={styles.playlistStats}>
              {currentPlaylist.cues.length} cues • Version {currentPlaylist.version}
            </Text>
            <Text style={styles.bleInfo}>
              BLE UUID: {currentPlaylist.bleUUID.substring(0, 18)}...
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Playlist</Text>
          <Text style={styles.emptyText}>
            Load a playlist from the Home tab first, then come back here to simulate cues.
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={openSimulator}
        >
          <Text style={styles.buttonText}>
            {currentPlaylist ? '🎯 Open Simulator' : '📋 Select Playlist'}
          </Text>
        </TouchableOpacity>

        {currentPlaylist && (
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleLoadPlaylist}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              🔄 Change Playlist
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>ℹ️ How to use Simulator</Text>
        <Text style={styles.infoText}>
          1. Load a playlist from Home tab{'\n'}
          2. Open the simulator here{'\n'}
          3. Manually trigger cues or use auto-playback{'\n'}
          4. Test TTS, audio, and other accessibility features{'\n'}
          5. Use Emergency Stop if needed
        </Text>
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.tipTitle}>💡 Pro Tips</Text>
        <Text style={styles.tipText}>
          • TTS speed is optimized for accessibility{'\n'}
          • Auto-playback has 8 second delays between cues{'\n'}
          • Emergency stop kills all audio immediately{'\n'}
          • Each cue can have multiple actions (TTS + audio + etc.)
        </Text>
      </View>

      <CueSimulatorModal
        visible={simulatorVisible}
        onClose={() => setSimulatorVisible(false)}
        playlist={currentPlaylist}
      />
    </View>
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
  playlistInfo: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  playlistCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistTheater: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 6,
  },
  playlistStats: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  bleInfo: {
    fontSize: 11,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  emptyState: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  tipSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#856404',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#856404',
  },
});