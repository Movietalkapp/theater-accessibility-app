// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import playlistService from '../src/services/playlistService';

import { useColorScheme } from '@/components/useColorScheme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle URL schemes för StageTalk
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 StageTalk received URL:', url);
      
      try {
        const parsed = Linking.parse(url);
        
        if (parsed.scheme === 'stagetalk' && parsed.hostname === 'playlist') {
          const playlistUrl = parsed.queryParams?.url as string;
          
          if (!playlistUrl) {
            Alert.alert('Fel', 'Ingen playlist-URL angiven', [{ text: 'OK' }]);
            return;
          }

          Alert.alert(
            '🎭 Ladda föreställning',
            `Ladda föreställning från:\n${playlistUrl}`,
            [
              { text: 'Avbryt', style: 'cancel' },
              { 
                text: 'Ladda', 
                onPress: async () => {
                  try {
                    await playlistService.loadPlaylistFromURL(playlistUrl);
                    Alert.alert('✅ Klart!', 'Föreställningen har laddats ner och är redo att användas.', [{ text: 'OK' }]);
                  } catch (error) {
                    Alert.alert('❌ Fel', `Kunde inte ladda föreställning: ${error}`, [{ text: 'OK' }]);
                  }
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
        Alert.alert('Fel', 'Ogiltigt URL-format', [{ text: 'OK' }]);
      }
    };

    // Lyssna på URL schemes
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Kontrollera om appen öppnades med en URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}