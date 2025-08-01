import { EventEmitter } from 'events';
import { Playlist, PlaylistCue } from '../types';
import actionEngine from './actionEngine';

interface SimulatorEvent {
  cueId: string;
  cue: PlaylistCue;
  timestamp: number;
}

class CueSimulator extends EventEmitter {
  private isRunning = false;
  private currentPlaylist: Playlist | null = null;
  private autoPlayInterval: NodeJS.Timeout | null = null;
  private autoPlayIndex = 0;

  // Starta simulator med playlist
  startSimulation(playlist: Playlist): void {
    this.currentPlaylist = playlist;
    this.isRunning = true;
    
    console.log(`🎭 Cue Simulator started for: ${playlist.showName}`);
    console.log(`📡 Simulating BLE UUID: ${playlist.bleUUID}`);
    
    this.emit('simulatorStarted', { playlist });
  }

  // Manuell cue triggering
  async triggerCue(cueId: string): Promise<void> {
    if (!this.isRunning || !this.currentPlaylist) {
      console.warn('⚠️ Simulator not running');
      return;
    }

    const cue = this.currentPlaylist.cues.find(c => c.id === cueId);
    if (!cue) {
      console.error(`❌ Cue not found: ${cueId}`);
      return;
    }

    console.log(`🎯 Triggering cue: ${cueId}`);
    
    const event: SimulatorEvent = {
      cueId,
      cue,
      timestamp: Date.now()
    };

    // Emit event först
    this.emit('cueTriggered', event);

    // Sedan kör actions
    try {
      await actionEngine.executeActions(cue.actions, cueId);
    } catch (error) {
      console.error(`Failed to execute actions for cue ${cueId}:`, error);
    }
  }

  // Automatisk uppspelning av alla cues
  startAutoPlayback(delayBetweenCues = 8000): void {
    if (!this.currentPlaylist) return;
    
    console.log(`▶️ Starting auto playback (${delayBetweenCues}ms between cues)`);
    
    this.autoPlayIndex = 0;
    this.autoPlayInterval = setInterval(() => {
      if (this.autoPlayIndex >= this.currentPlaylist!.cues.length) {
        this.stopAutoPlayback();
        return;
      }
      
      const cue = this.currentPlaylist!.cues[this.autoPlayIndex];
      this.triggerCue(cue.id);
      this.autoPlayIndex++;
    }, delayBetweenCues);
    
    this.emit('autoPlaybackStarted');
  }

  // Stoppa automatisk uppspelning
  stopAutoPlayback(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      this.autoPlayIndex = 0;
      console.log('⏹️ Auto playback stopped');
      this.emit('autoPlaybackStopped');
    }
  }

  // Hämta alla scener för UI
  getScenes(): Record<string, PlaylistCue[]> {
    if (!this.currentPlaylist) return {};
    
    const scenes: Record<string, PlaylistCue[]> = {};
    this.currentPlaylist.cues.forEach(cue => {
      const [sceneNumber] = cue.id.split('.');
      if (!scenes[sceneNumber]) {
        scenes[sceneNumber] = [];
      }
      scenes[sceneNumber].push(cue);
    });
    
    return scenes;
  }

  // Emergency stop - stoppa allt
  async emergencyStop(): Promise<void> {
    console.log('🚨 Emergency stop activated!');
    
    this.stopAutoPlayback();
    await actionEngine.stopAllActions();
    
    this.emit('emergencyStop');
  }

  // Stoppa simulator
  stopSimulation(): void {
    this.isRunning = false;
    this.stopAutoPlayback();
    this.currentPlaylist = null;
    
    console.log('🛑 Cue Simulator stopped');
    this.emit('simulatorStopped');
  }

  // Hämta simulator status
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentPlaylist: this.currentPlaylist?.showName || null,
      autoPlaybackActive: !!this.autoPlayInterval,
      totalCues: this.currentPlaylist?.cues.length || 0,
      nextCueIndex: this.autoPlayIndex
    };
  }

  // Hämta current playlist
  getCurrentPlaylist(): Playlist | null {
    return this.currentPlaylist;
  }
}

export default new CueSimulator();