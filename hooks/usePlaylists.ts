// hooks/usePlaylists.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import playlistService from '../src/services/playlistService';
import { PlaylistMetadata } from '../src/types';

export function usePlaylists(announceForAccessibility: (message: string) => void) {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);

  const loadPlaylists = useCallback(async () => {
    try {
      const metadata = await playlistService.getPlaylistsMetadata();
      setPlaylists(metadata);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }, []);

  const deletePlaylist = async (playlistId: string, showName: string) => {
    Alert.alert(
      '🗑️ Ta bort föreställning',
      `Vill du ta bort "${showName}" från appen?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistService.deletePlaylist(playlistId);
              await loadPlaylists();
              announceForAccessibility(`${showName} har tagits bort`);
            } catch (error) {
              Alert.alert('Fel', `Kunde inte ta bort föreställningen: ${error}`, [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };



  return {
    playlists,
    loadPlaylists,
    deletePlaylist,
  };
}