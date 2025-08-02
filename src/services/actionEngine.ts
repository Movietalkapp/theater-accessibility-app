import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { CueAction } from '../types';

class ActionEngine {
  private audioObjects = new Map<string, Audio.Sound>();

  async executeActions(actions: CueAction[], cueId: string): Promise<void> {
    console.log(`🎬 Executing ${actions.length} actions for cue ${cueId}`);

    for (const action of actions) {
      try {
        // Vänta delay om specificerat
        if (action.delay && action.delay > 0) {
          console.log(`⏳ Waiting ${action.delay}ms before ${action.type}`);
          await this.delay(action.delay);
        }

        await this.executeAction(action, cueId);
      } catch (error) {
        console.error(`❌ Failed to execute ${action.type} action:`, error);
      }
    }
  }

  private async executeAction(action: CueAction, cueId: string): Promise<void> {
    switch (action.type) {
      case 'tts':
        await this.executeTTS(action);
        break;
      case 'text':
        await this.executeTextDisplay(action);
        break;
      case 'audio':
        await this.executeAudio(action, cueId);
        break;
      case 'video':
        await this.executeVideo(action);
        break;
      case 'subtitle':
        await this.executeSubtitle(action);
        break;
      default:
        console.warn(`Unknown action type: ${(action as any).type}`);
    }
  }

  // Text-to-Speech
  private async executeTTS(action: CueAction): Promise<void> {
    if (!action.text) {
      console.warn('TTS action missing text');
      return;
    }

    console.log(`🔊 TTS: "${action.text}"`);

    const options: Speech.SpeechOptions = {
      language: action.language || 'sv-SE',
      pitch: 1.0,
      rate: 0.8, // Lite långsammare för tillgänglighet
      voice: undefined // Använd systemets default
    };

    // Kolla om TTS redan körs
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      // Stoppa pågående TTS först
      Speech.stop();
      // Vänta lite innan vi startar ny
      await this.delay(100);
    }

    Speech.speak(action.text, options);
  }

  // Text display (visar alert för nu, senare egen komponent)
  private async executeTextDisplay(action: CueAction): Promise<void> {
    if (!action.text) return;

    console.log(`📝 Text Display: "${action.text}"`);
    
    // För utveckling - visa som alert
    Alert.alert('🎭 Scene Text', action.text, [{ text: 'OK' }]);
  }

  // Audio playback
  private async executeAudio(action: CueAction, cueId: string): Promise<void> {
    if (!action.file) {
      console.warn('Audio action missing file');
      return;
    }

    console.log(`🎵 Audio: ${action.file}`);

    try {
      // För utveckling - simulera audio playback
      const audioFile = action.file || 'unknown';
      const volume = action.volume || 1.0;
      Alert.alert('🎵 Audio Cue', `Would play: ${audioFile}\n\nVolume: ${volume}`, [{ text: 'OK' }]);
      
      // TODO: Implementera riktig audio playback när vi har ljudfiler
      // const { sound } = await Audio.Sound.createAsync(
      //   { uri: localPath },
      //   { 
      //     shouldPlay: true,
      //     volume: action.volume || 1.0,
      //     isLooping: false
      //   }
      // );

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  // Video playback (placeholder)
  private async executeVideo(action: CueAction): Promise<void> {
    const videoFile = action.file || 'unknown';
    console.log(`🎬 Video: ${videoFile}`);
    Alert.alert('🎬 Video Cue', `Would play video: ${videoFile}`, [{ text: 'OK' }]);
  }

  // Subtitle display (placeholder)
  private async executeSubtitle(action: CueAction): Promise<void> {
    const subtitleText = action.text || 'No subtitle text';
    console.log(`📺 Subtitle: ${subtitleText}`);
    Alert.alert('📺 Subtitle', subtitleText, [{ text: 'OK' }]);
  }

  // Stoppa alla pågående actions
  async stopAllActions(): Promise<void> {
    console.log('🛑 Stopping all actions');

    // Stoppa TTS
    Speech.stop();

    // Stoppa alla ljud
    for (const [key, sound] of this.audioObjects) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Error stopping audio ${key}:`, error);
      }
    }
    this.audioObjects.clear();
  }

  // Hjälpfunktion för delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Kolla TTS-status
  async getTTSStatus(): Promise<boolean> {
    return await Speech.isSpeakingAsync();
  }
}

export default new ActionEngine();