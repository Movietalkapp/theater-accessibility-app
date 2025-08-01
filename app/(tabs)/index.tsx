import { StyleSheet, TouchableOpacity, FlatList, StatusBar, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Text, View } from '@/components/Themed';
import { useFocusEffect } from '@react-navigation/native';
import * as KeepAwake from 'expo-keep-awake';
import playlistService from '../../src/services/playlistService';
import cueSimulator from '../../src/services/cueSimulator';
import { PlaylistMetadata, Playlist } from '../../src/types';

export default function StageTalkScreen() {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [theaterMode, setTheaterMode] = useState(false);
  const [currentShow, setCurrentShow] = useState<Playlist | null>(null);
  const [showStopButton, setShowStopButton] = useState(false);

  // Ladda playlists när screen fokuseras
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [])
  );

  const loadPlaylists = async () => {
    try {
      const metadata = await playlistService.getPlaylistsMetadata();
      setPlaylists(metadata);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  // Klick på playlist - starta föreställning
  const startShow = async (playlistId: string) => {
    try {
      const playlist = await playlistService.getPlaylist(playlistId);
      if (!playlist) return;

      // Sätt som aktiv playlist
      playlistService.setCurrentPlaylist(playlist);
      setCurrentShow(playlist);

      // Starta simulator (för testning - senare BLE)
      cueSimulator.startSimulation(playlist);

      // Aktivera theater mode
      KeepAwake.activateKeepAwake();
      StatusBar.setHidden(true);
      setTheaterMode(true);

      console.log(`🎭 Started listening for: ${playlist.showName}`);
    } catch (error) {
      Alert.alert('Error', `Failed to start show: ${error}`);
    }
  };

  // Tryck på svart skärm - visa stop knapp
  const handleScreenTap = () => {
    setShowStopButton(true);
    // Dölj stop knapp efter 3 sekunder
    setTimeout(() => setShowStopButton(false), 3000);
  };

  // Stoppa föreställning
  const stopShow = () => {
    Alert.alert(
      '🛑 Stoppa föreställning',
      'Vill du sluta lyssna och återgå till listan?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Stoppa',
          style: 'destructive',
          onPress: () => {
            // Återställ normal läge
            KeepAwake.deactivateKeepAwake();
            StatusBar.setHidden(false);
            setTheaterMode(false);
            setCurrentShow(null);
            setShowStopButton(false);
            
            // Stoppa simulator
            cueSimulator.stopSimulation();
            
            console.log('🛑 Show stopped');
          }
        }
      ]
    );
  };

  // Lägg till test-playlist om listan är tom
  const addTestShow = async () => {
    try {
      const testPlaylist = {
        playlistId: 'stagetalk-test-hamlet',
        theaterName: 'Dramaten',
        showName: 'Hamlet',
        version: '1.0.0',
        bleUUID: '550e8400-e29b-41d4-a716-446655440000',
        checksum: '',
        cues: [
          {
            id: '1.1',
            actions: [
              {
                type: 'tts' as const,
                text: 'Ridån höjs. Vi ser Elsinores slott i Danmark. Det är natt och mycket kallt.',
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
                text: 'Hamlet kommer in från höger. Han är klädd i svart och ser djupt melankolisk ut.',
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
                text: 'Akt två. Claudius sitter på tronen omgiven av hela hovet. Gertrude står bredvid honom.',
                language: 'sv-SE',
                delay: 0
              }
            ]
          }
        ],
        mediaFiles: [],
        createdAt: new Date().toISOString()
      };

      await playlistService.savePlaylist(testPlaylist);
      await loadPlaylists();
    } catch (error) {
      Alert.alert('Error', `Failed to add test show: ${error}`);
    }
  };

  // Theater Mode - svart skärm
  if (theaterMode) {
    return (
      <TouchableOpacity
        style={styles.theaterScreen}
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        <StatusBar hidden />
        
        {/* Minimal lyssnar-indikator */}
        <View style={styles.listeningIndicator}>
          <View style={styles.listeningDot} />
        </View>

        {/* Stop knapp (visas bara vid tryck) */}
        {showStopButton && (
          <View style={styles.stopButtonContainer}>
            <TouchableOpacity style={styles.stopButton} onPress={stopShow}>
              <Text style={styles.stopButtonText}>🛑 Stoppa</Text>
            </TouchableOpacity>
            <Text style={styles.stopHint}>Tryck igen för att dölja</Text>
          </View>
        )}

        {/* Mycket subtil show-info längst ner */}
        <View style={styles.showInfo}>
  {currentShow?.showName && (
    <Text style={styles.showTitle}>
      {currentShow.showName}
    </Text>
  )}
</View>
      </TouchableOpacity>
    );
  }

  // Normal läge - lista med föreställningar
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Instruktion */}
      <Text style={styles.instruction}>
        Klicka på föreställningen för att starta
      </Text>

      {/* Lista med föreställningar */}
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Inga föreställningar</Text>
          <Text style={styles.emptyText}>
            Ladda ner en föreställning via länk från teatern
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={addTestShow}>
            <Text style={styles.testButtonText}>+ Lägg till test-föreställning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.playlistId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.showCard}
              onPress={() => startShow(item.playlistId)}
            >
              <Text style={styles.showTitle}>{item.showName}</Text>
              <Text style={styles.showTheater}>{item.theaterName}</Text>
              <Text style={styles.showDate}>
                Nedladdad: {new Date(item.downloadedAt).toLocaleDateString('sv-SE')}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333333',
    fontWeight: '500',
  },
  
  listContainer: {
    paddingBottom: 20,
  },
  
  showCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  showTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  
  showTheater: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  
  showDate: {
    fontSize: 12,
    color: '#999999',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Theater Mode Styles
  theaterScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  listeningIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff00',
    opacity: 0.6,
  },
  
  stopButtonContainer: {
    alignItems: 'center',
  },
  
  stopButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 12,
  },
  
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  stopHint: {
    color: '#444444',
    fontSize: 12,
    textAlign: 'center',
  },
  
  showInfo: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  
  showTitle: {
    color: '#333333',
    fontSize: 12,
    opacity: 0.5,
  },
});