import { useState, useCallback } from 'react';
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

  // Bara ta bort, ingen Alert här!
  const deletePlaylist = async (playlistId: string, showName: string) => {
    try {
      await playlistService.deletePlaylist(playlistId);
      await loadPlaylists();
      announceForAccessibility(`${showName} har tagits bort`);
    } catch (error) {
      // Denna alert kan vara kvar för att visa FEL, men inte som bekräftelse
      // (Men vill du ha det superrent, hantera även fel från PlaylistList)
      Alert.alert('Fel', `Kunde inte ta bort föreställningen: ${error}`, [{ text: 'OK' }]);
    }
  };

  return {
    playlists,
    loadPlaylists,
    deletePlaylist,
  };
}
