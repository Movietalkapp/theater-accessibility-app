// src/services/playlistService.ts - Updated
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
      
      // Verifiera checksum - STOPPA här vid fel
      const checksumValid = await this.verifyPlaylistChecksum(playlist);
      if (!checksumValid) {
        throw new Error('Playlist checksum verification failed. This playlist may be corrupted or unauthorized.');
      }
      
      // Spara playlist lokalt
      await this.savePlaylist(playlist);
      
      this.currentPlaylist = playlist;
      console.log('✅ Playlist loaded and verified successfully:', playlist.showName);
      
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

  // Verifiera checksum med robust validering
  private async verifyPlaylistChecksum(playlist: Playlist): Promise<boolean> {
    try {
      // Kräv alltid checksum i produktion
      if (!playlist.checksum || playlist.checksum.trim() === '') {
        console.error('❌ No checksum provided in playlist');
        return false;
      }
      
      // Skapa deterministisk hash av cues-innehållet
      const cuesHash = await this.generateCuesChecksum(playlist.cues, playlist.playlistId);
      
      const isValid = cuesHash === playlist.checksum;
      
      if (isValid) {
        console.log('✅ Checksum valid - playlist integrity verified');
      } else {
        console.error('❌ Checksum invalid - playlist may be corrupted or unauthorized');
        console.error('Expected:', playlist.checksum);
        console.error('Calculated:', cuesHash);
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Checksum verification error:', error);
      return false;
    }
  }

  // Generera checksum för cues (samma algoritm som webb-portalen)
  private async generateCuesChecksum(cues: any[], playlistId: string): Promise<string> {
    try {
      // Skapa deterministisk representation av cues
      const normalizedCues = this.normalizeCuesForHashing(cues);
      
      // Kombinera med playlist-specifikt salt
      const salt = this.generatePlaylistSalt(playlistId);
      const dataToHash = JSON.stringify(normalizedCues) + salt;
      
      // Använd SHA-256 för säkerhet
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataToHash
      );
      
      return hash;
    } catch (error) {
      console.error('Failed to generate cues checksum:', error);
      throw error;
    }
  }

  // Normalisera cues för konsistent hashing
  private normalizeCuesForHashing(cues: any[]): any[] {
    return cues
      .map(cue => ({
        id: cue.id,
        actions: cue.actions.map((action: any) => ({
          type: action.type,
          text: action.text?.trim() || '',
          language: action.language || '',
          delay: action.delay || 0,
          // Inkludera andra relevanta fält men normalisera dem
          ...(action.volume !== undefined && { volume: action.volume }),
          ...(action.pitch !== undefined && { pitch: action.pitch }),
          ...(action.rate !== undefined && { rate: action.rate })
        }))
      }))
      .sort((a, b) => a.id.localeCompare(b.id)); // Sortera för konsistens
  }

  // Generera playlist-specifikt salt (samma som webb-portalen ska använda)
  private generatePlaylistSalt(playlistId: string): string {
    // Använd en kombination av:
    // 1. Fast app-specifik nyckel 
    // 2. Playlist-specifik data
    // 3. Tidsoberoende hash (så samma playlist får samma salt)
    
    const appSecret = 'StageTalk_v1_2025'; // Samma som webb-portalen
    const playlistDate = playlistId.split('_')[1] || '2025'; // Extrahera år från ID
    
    return `${appSecret}:${playlistId}:${playlistDate}:validation`;
  }

  // Spara playlist lokalt (nu public så den kan användas från andra delar)
  async savePlaylist(playlist: Playlist): Promise<void> {
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

  // Debug-funktion för att testa checksum-generering
  async debugGenerateChecksum(cues: any[], playlistId: string): Promise<string> {
    console.log('🔍 Debug: Generating checksum for playlist:', playlistId);
    console.log('🔍 Debug: Number of cues:', cues.length);
    
    const checksum = await this.generateCuesChecksum(cues, playlistId);
    console.log('🔍 Debug: Generated checksum:', checksum);
    
    return checksum;
  }
}

export default new PlaylistService();