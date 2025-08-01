import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  SafeAreaView
} from 'react-native';
import cueSimulator from '../services/cueSimulator';
import { Playlist, PlaylistCue } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

export default function CueSimulatorModal({ visible, onClose, playlist }: Props) {
  const [scenes, setScenes] = useState<Record<string, PlaylistCue[]>>({});
  const [autoPlayback, setAutoPlayback] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<any>({});

  useEffect(() => {
    if (playlist && visible) {
      // Starta simulator med playlist
      cueSimulator.startSimulation(playlist);
      setScenes(cueSimulator.getScenes());
      
      // Lyssna på simulator events
      const handleCueTriggered = (data: any) => {
        console.log('🎭 Cue triggered in UI:', data.cueId);
        setSimulatorStatus(cueSimulator.getStatus());
      };

      const handleAutoPlaybackStarted = () => setAutoPlayback(true);
      const handleAutoPlaybackStopped = () => setAutoPlayback(false);

      cueSimulator.on('cueTriggered', handleCueTriggered);
      cueSimulator.on('autoPlaybackStarted', handleAutoPlaybackStarted);
      cueSimulator.on('autoPlaybackStopped', handleAutoPlaybackStopped);

      return () => {
        cueSimulator.off('cueTriggered', handleCueTriggered);
        cueSimulator.off('autoPlaybackStarted', handleAutoPlaybackStarted);
        cueSimulator.off('autoPlaybackStopped', handleAutoPlaybackStopped);
        cueSimulator.stopSimulation();
      };
    }
  }, [playlist, visible]);

  const handleCueTrigger = (cueId: string) => {
    cueSimulator.triggerCue(cueId);
  };

  const toggleAutoPlayback = () => {
    if (autoPlayback) {
      cueSimulator.stopAutoPlayback();
    } else {
      Alert.alert(
        'Auto Playback',
        'Start automatic playback of all cues?\n\n8 sekunder mellan varje cue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start', 
            onPress: () => cueSimulator.startAutoPlayback(8000)
          }
        ]
      );
    }
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '🚨 Emergency Stop',
      'Stop all audio, TTS, and playback immediately?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'STOP ALL', 
          style: 'destructive',
          onPress: () => cueSimulator.emergencyStop()
        }
      ]
    );
  };

  const renderCueButton = (cue: PlaylistCue) => {
    const actionSummary = cue.actions.map(a => {
      switch (a.type) {
        case 'tts': return `🔊 "${a.text?.substring(0, 30)}..."`;
        case 'audio': return `🎵 ${a.file}`;
        case 'video': return `🎬 ${a.file}`;
        case 'text': return `📝 "${a.text?.substring(0, 30)}..."`;
        default: return `❓ ${a.type}`;
      }
    }).join(' + ');

    return (
      <TouchableOpacity
        key={cue.id}
        style={styles.cueButton}
        onPress={() => handleCueTrigger(cue.id)}
      >
        <View style={styles.cueButtonHeader}>
          <Text style={styles.cueButtonText}>Cue {cue.id}</Text>
<Text style={styles.cueActionCount}>
  {cue.actions.length} action{cue.actions.length !== 1 ? 's' : ''}
</Text>
        </View>
        <Text style={styles.cueDescription} numberOfLines={2}>
          {actionSummary}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!playlist) return null;

  const sceneNumbers = Object.keys(scenes).sort((a, b) => Number(a) - Number(b));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>🎭 Cue Simulator</Text>
            <Text style={styles.subtitle}>{playlist.showName}</Text>
            <Text style={styles.theaterName}>{playlist.theaterName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Auto Playback</Text>
            <Switch
              value={autoPlayback}
              onValueChange={toggleAutoPlayback}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoPlayback ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              📡 UUID: {playlist.bleUUID.substring(0, 8)}...
            </Text>
            <Text style={styles.statsText}>
              🎯 {playlist.cues.length} cues in {sceneNumbers.length} scenes
            </Text>
            {autoPlayback && (
              <Text style={styles.statsText}>
                ▶️ Playing cue {simulatorStatus.nextCueIndex + 1} of {playlist.cues.length}
              </Text>
            )}
          </View>
        </View>

        {/* Scene List */}
        <ScrollView style={styles.scenesList} showsVerticalScrollIndicator={false}>
          {sceneNumbers.map((sceneNumber) => (
            <View key={sceneNumber} style={styles.sceneSection}>
              <Text style={styles.sceneTitle}>Scene {sceneNumber}</Text>
              <View style={styles.cuesContainer}>
                {scenes[sceneNumber]?.map(renderCueButton)}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickButton, styles.testButton]}
            onPress={() => handleCueTrigger(playlist.cues[0]?.id)}
          >
            <Text style={styles.quickButtonText}>🧪 Test First Cue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, styles.emergencyButton]}
            onPress={handleEmergencyStop}
          >
            <Text style={styles.quickButtonText}>🚨 Emergency Stop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#2196F3',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  theaterName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#24292e',
  },
  stats: {
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#586069',
  },
  scenesList: {
    flex: 1,
    padding: 16,
  },
  sceneSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sceneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 12,
  },
  cuesContainer: {
    gap: 8,
  },
  cueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  cueButtonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cueActionCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  cueDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});