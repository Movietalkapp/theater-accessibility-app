// 3. Skapa PlaylistService - skapa fil: src/services/playlistService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Playlist, PlaylistMetadata } from '../types';

class PlaylistService {
  private currentPlaylist: Playlist | null = null;
  private mediaCache = new Map<string, string>();

  // Ladda playlist från URL (via URL scheme)
  async loadPlaylistFromURL(url: string): Promise<Playlist> {
    try {
      console.log('📥 Loading playlist from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playlist = await response.json();
      
      // Validera playlist struktur
      if (!this.validatePlaylistStructure(playlist)) {
        throw new Error('Invalid playlist structure');
      }
      
      // Verifiera checksum (simulerat för nu)
      if (!await this.verifyPlaylistChecksum(playlist)) {
        console.warn('⚠️ Checksum verification failed, but continuing...');
      }
      
      // Spara playlist lokalt
      await this.savePlaylist(playlist);
      
      this.currentPlaylist = playlist;
      console.log('✅ Playlist loaded successfully:', playlist.showName);
      
      return playlist;
    } catch (error) {
      console.error('❌ Failed to load playlist:', error);
      throw error;
    }
  }

  // Validera playlist struktur
  private validatePlaylistStructure(playlist: any): playlist is Playlist {
    const required = ['playlistId', 'theaterName', 'showName', 'bleUUID', 'cues'];
    
    for (const field of required) {
      if (!playlist[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validera cues
    if (!Array.isArray(playlist.cues)) {
      console.error('Cues must be an array');
      return false;
    }
    
    for (const cue of playlist.cues) {
      if (!cue.id || !cue.actions || !Array.isArray(cue.actions)) {
        console.error('Invalid cue structure:', cue);
        return false;
      }
    }
    
    return true;
  }

  // Verifiera checksum (förenklad version för utveckling)
  private async verifyPlaylistChecksum(playlist: Playlist, salt = 'dev-salt'): Promise<boolean> {
    try {
      if (!playlist.checksum) return true; // Skip i utveckling
      
      const dataToHash = JSON.stringify(playlist.cues) + salt;
      const calculatedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        dataToHash
      );
      
      const isValid = calculatedHash === playlist.checksum;
      console.log(isValid ? '✅ Checksum valid' : '❌ Checksum invalid');
      
      return isValid;
    } catch (error) {
      console.error('Checksum verification error:', error);
      return false;
    }
  }

  // Spara playlist lokalt
  private async savePlaylist(playlist: Playlist): Promise<void> {
    try {
      // Spara själva playlist
      await AsyncStorage.setItem(
        `playlist_${playlist.playlistId}`, 
        JSON.stringify(playlist)
      );
      
      // Uppdatera metadata lista
      const metadata: PlaylistMetadata = {
        playlistId: playlist.playlistId,
        theaterName: playlist.theaterName,
        showName: playlist.showName,
        version: playlist.version,
        downloadedAt: new Date().toISOString()
      };
      
      const existing = await this.getPlaylistsMetadata();
      const updated = [metadata, ...existing.filter(p => p.playlistId !== playlist.playlistId)];
      
      await AsyncStorage.setItem('playlists_metadata', JSON.stringify(updated));
      
      console.log('💾 Playlist saved locally');
    } catch (error) {
      console.error('Failed to save playlist:', error);
      throw error;
    }
  }

  // Hämta alla sparade playlists metadata
  async getPlaylistsMetadata(): Promise<PlaylistMetadata[]> {
    try {
      const data = await AsyncStorage.getItem('playlists_metadata');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get playlists metadata:', error);
      return [];
    }
  }

  // Hämta specifik playlist
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const data = await AsyncStorage.getItem(`playlist_${playlistId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get playlist:', error);
      return null;
    }
  }

  // Sätt aktuell playlist
  setCurrentPlaylist(playlist: Playlist): void {
    this.currentPlaylist = playlist;
  }

  // Hämta aktuell playlist
  getCurrentPlaylist(): Playlist | null {
    return this.currentPlaylist;
  }

  // Hitta specifik cue i aktuell playlist
  findCue(cueId: string): any {
    if (!this.currentPlaylist) return null;
    return this.currentPlaylist.cues.find(cue => cue.id === cueId);
  }

  // Ta bort playlist
  async deletePlaylist(playlistId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`playlist_${playlistId}`);
      
      const metadata = await this.getPlaylistsMetadata();
      const updated = metadata.filter(p => p.playlistId !== playlistId);
      await AsyncStorage.setItem('playlists_metadata', JSON.stringify(updated));
      
      console.log('🗑️ Playlist deleted:', playlistId);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  }
}

export default new PlaylistService();