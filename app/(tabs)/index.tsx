// app/(tabs)/index.tsx - StageTalkScreen med full accessibility och Modal
import {
  StyleSheet, TouchableOpacity, FlatList, StatusBar, Alert, BackHandler,
  AccessibilityInfo, Modal, View as RNView, findNodeHandle
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View } from '@/components/Themed';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as KeepAwake from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import playlistService from '../../src/services/playlistService';
import cueSimulator from '../../src/services/cueSimulator';
import { PlaylistMetadata, Playlist } from '../../src/types';

export default function StageTalkScreen() {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [theaterMode, setTheaterMode] = useState(false);
  const [currentShow, setCurrentShow] = useState<Playlist | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [isVoiceOverRunning, setIsVoiceOverRunning] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const exitButtonRef = useRef<TouchableOpacity>(null);
  const navigation = useNavigation();

  // Kolla VoiceOver-status
  useEffect(() => {
    const checkVoiceOver = async () => {
      const isRunning = await AccessibilityInfo.isScreenReaderEnabled();
      setIsVoiceOverRunning(isRunning);
    };
    checkVoiceOver();
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsVoiceOverRunning);
    return () => subscription?.remove();
  }, []);

  // Ladda playlists när screen fokuseras
  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [])
  );

  // Android tillbaka-knapp
  useEffect(() => {
    const backAction = () => {
      if (theaterMode) {
        if (showExitDialog) {
          exitTheaterMode();
        } else {
          showExitDialogWithFocus();
        }
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [theaterMode, showExitDialog]);

  // Dölj header i teaterläge
  useEffect(() => {
    navigation.setOptions({
      headerShown: !theaterMode,
    });
  }, [theaterMode, navigation]);

  // Announcement när theaterMode startas
  useEffect(() => {
    if (theaterMode) {
      AccessibilityInfo.announceForAccessibility(
        "Dubbeltryck och håll kvar fingret på skärmen för att stoppa."
      );
    }
  }, [theaterMode]);

  const loadPlaylists = async () => {
    try {
      const metadata = await playlistService.getPlaylistsMetadata();
      setPlaylists(metadata);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  // Visa exit-dialog med auto-fokus på stopp-knappen
  const showExitDialogWithFocus = () => {
    setShowExitDialog(true);
    setTimeout(() => {
      if (isVoiceOverRunning && exitButtonRef.current) {
        const tag = findNodeHandle(exitButtonRef.current);
        if (tag) {
          AccessibilityInfo.setAccessibilityFocus(tag);
        }
      }
    }, 400);
  };

  // Hantera långtryck
  const handleLongPressStart = () => {
    if (showExitDialog) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let progress = 0;
    longPressTimer.current = setInterval(() => {
      progress += 3;
      setLongPressProgress(progress);
      if (progress >= 100) {
        clearInterval(longPressTimer.current!);
        longPressTimer.current = null;
        setLongPressProgress(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showExitDialogWithFocus();
      }
    }, 30);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
      setLongPressProgress(0);
    }
  };

  // Exit teaterläge
  const exitTheaterMode = () => {
    KeepAwake.deactivateKeepAwake();
    StatusBar.setHidden(false);
    setTheaterMode(false);
    setCurrentShow(null);
    setShowExitDialog(false);
    setLongPressProgress(0);
    cueSimulator.stopSimulation();
    console.log('🛑 Show stopped');
  };

  const cancelExit = () => setShowExitDialog(false);

  // Hjälpfunktion för säker datumformatering
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleDateString('sv-SE') || 'Unknown date';
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Starta föreställning
  const startShow = async (playlistId: string) => {
    try {
      const playlist = await playlistService.getPlaylist(playlistId);
      if (!playlist) return;
      playlistService.setCurrentPlaylist(playlist);
      setCurrentShow(playlist);
      cueSimulator.startSimulation(playlist);
      KeepAwake.activateKeepAwake();
      StatusBar.setHidden(true);
      setTheaterMode(true);
      console.log(`🎭 Started listening for: ${playlist.showName}`);
    } catch (error) {
      Alert.alert('Error', `Failed to start show: ${error}`, [{ text: 'OK' }]);
    }
  };

  // Lägg till test-playlist
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
      Alert.alert('Error', `Failed to add test show: ${error}`, [{ text: 'OK' }]);
    }
  };

  // THEATER MODE
  if (theaterMode) {
    return (
      <View style={styles.theaterScreen}>
        <StatusBar hidden />
        {/* Fullskärms touch-area för långtryck */}
        <TouchableOpacity
          style={styles.fullScreenTouch}
          onPressIn={handleLongPressStart}
          onPressOut={handleLongPressEnd}
          activeOpacity={1}
          accessible={!showExitDialog}
          accessibilityLabel={`Lyssningsläge för ${currentShow?.showName}. Tryck två gånger och håll för att stoppa.`}
          accessibilityHint="Dubbelknacka och håll kvar fingret för att visa alternativ för att stoppa föreställningen"
          accessibilityRole="button"
        />

        {/* Minimal lyssnar-indikator - mycket svag */}
        <View
          style={styles.listeningIndicator}
          accessible={false}
        >
          <View
            style={styles.listeningDot}
            accessible={false}
          />
        </View>

        {/* Långtryck progress - bara synlig under tryck */}
        {longPressProgress > 0 && (
          <View style={styles.progressContainer} accessible={false}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${longPressProgress}%` }]} />
            </View>
          </View>
        )}

        {/* EXIT DIALOG MED MODAL */}
        <Modal
          visible={showExitDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelExit}
          accessible={true}
          accessibilityViewIsModal={true}
        >
          <RNView style={styles.exitDialogOverlay}>
            <RNView style={styles.exitDialogContainer}>
              <Text
                style={styles.dialogTitle}
                accessibilityRole="header"
                accessible={true}
              >
                Vill du avsluta föreställningen?
              </Text>
              <TouchableOpacity
                ref={exitButtonRef}
                style={styles.exitButton}
                onPress={exitTheaterMode}
                accessible={true}
                accessibilityLabel="Stoppa föreställning"
                accessibilityHint="Avsluta lyssningsläge och återgå till listan"
                accessibilityRole="button"
              >
                <Text style={styles.exitButtonText}>Stoppa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelExit}
                accessible={true}
                accessibilityLabel="Fortsätt lyssna"
                accessibilityHint="Fortsätt lyssna på föreställningen"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Fortsätt</Text>
              </TouchableOpacity>
            </RNView>
          </RNView>
        </Modal>
      </View>
    );
  }

  // NORMAL MODE
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Instruktion */}
      <Text
        style={styles.instruction}
        accessible={true}
        accessibilityRole="header"
      >
        Välj föreställning att lyssna på
      </Text>

      {/* Lista med föreställningar */}
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={styles.emptyTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Inga föreställningar
          </Text>
          <Text
            style={styles.emptyText}
            accessible={true}
          >
            Ladda ner en föreställning via länk från teatern
          </Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={addTestShow}
            accessible={true}
            accessibilityLabel="Lägg till test-föreställning"
            accessibilityHint="Lägg till en demo-föreställning av Hamlet för att testa appen"
            accessibilityRole="button"
          >
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
              accessible={true}
              accessibilityLabel={`${item.showName}`}
              accessibilityHint="Starta denna föreställning"
              accessibilityRole="button"
            >
              <Text style={styles.showTitle}>{item.showName}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          accessible={false}
          removeClippedSubviews={false}
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
    justifyContent: 'center',
    minHeight: 60,
  },
  showTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
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
  // Theater Mode - helt mörk
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
  exitDialogOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitDialogContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  dialogTitle: {
    color: '#fff', 
    fontSize: 18, 
    marginBottom: 24, 
    textAlign: 'center',
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 20,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555555',
    minWidth: 140,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});