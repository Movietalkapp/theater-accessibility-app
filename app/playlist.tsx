// app/playlist.tsx - Route handler för deep links
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import playlistService from '../src/services/playlistService';

export default function PlaylistHandler() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();

  useEffect(() => {
    if (url) {
      downloadPlaylist(url);
    } else {
      // Ingen URL parameter, gå tillbaka till hem
      router.replace('/');
    }
  }, [url]);

  const downloadPlaylist = async (playlistUrl: string) => {
    try {
      console.log('📥 Downloading playlist from route handler:', playlistUrl);
      
      // Ladda ner playlist
      const playlist = await playlistService.loadPlaylistFromURL(playlistUrl);
      
      // Visa bekräftelse
      Alert.alert(
        '✅ Föreställning laddad',
        `"${playlist.showName}" från ${playlist.theaterName} har laddats ner och är redo att användas.`,
        [{ 
          text: 'OK', 
          onPress: () => router.replace('/') // Gå tillbaka till hem
        }]
      );
      
    } catch (error) {
      console.error('❌ Failed to download playlist:', error);
      
      let errorMessage = 'Okänt fel uppstod';
      if (error instanceof Error) {
        if (error.message.includes('HTTP 404')) {
          errorMessage = 'Föreställningen kunde inte hittas. Kontrollera länken.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Nätverksfel. Kontrollera din internetanslutning.';
        } else if (error.message.includes('Invalid playlist')) {
          errorMessage = 'Ogiltig föreställningsdata.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(
        '❌ Fel vid nedladdning',
        `Kunde inte ladda ner föreställningen:\n${errorMessage}`,
        [{ 
          text: 'OK', 
          onPress: () => router.replace('/') // Gå tillbaka till hem även vid fel
        }]
      );
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#000000'
    }}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={{ 
        color: '#ffffff', 
        marginTop: 20, 
        fontSize: 16 
      }}>
        Laddar ner föreställning...
      </Text>
    </View>
  );
}