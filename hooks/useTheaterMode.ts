// hooks/useTheaterMode.ts
import { useState, useEffect, useRef } from 'react';
import { Alert, StatusBar, BackHandler } from 'react-native';
import * as KeepAwake from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import playlistService from '../src/services/playlistService';
import cueSimulator from '../src/services/cueSimulator';
import { Playlist } from '../src/types';

interface UseTheaterModeProps {
  announceForAccessibility: (message: string) => void;
  setAccessibilityFocus: (nodeHandle: number) => void;
  isVoiceOverRunning: boolean;
  navigation: any;
}

export function useTheaterMode({ 
  announceForAccessibility, 
  setAccessibilityFocus,
  isVoiceOverRunning,
  navigation 
}: UseTheaterModeProps) {
  const [theaterMode, setTheaterMode] = useState(false);
  const [currentShow, setCurrentShow] = useState<Playlist | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Dölj header i teaterläge
  useEffect(() => {
    navigation.setOptions({
      headerShown: !theaterMode,
    });
  }, [theaterMode, navigation]);

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

  const showExitDialogWithFocus = (exitButtonRef?: any) => {
    setShowExitDialog(true);
    setTimeout(() => {
      if (isVoiceOverRunning && exitButtonRef?.current) {
        const tag = exitButtonRef.current;
        if (tag) {
          setAccessibilityFocus(tag);
        }
      }
    }, 400);
  };

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

  // Uppdaterad startShow
// I useTheaterMode.ts

const startShow = async (playlistId: string) => {
  try {
    const playlist = await playlistService.getPlaylist(playlistId);
    if (!playlist) return;

    playlistService.setCurrentPlaylist(playlist);
    setCurrentShow(playlist);
    cueSimulator.startSimulation(playlist);
    await KeepAwake.activateKeepAwakeAsync();
    StatusBar.setHidden(true);
    setTheaterMode(true);
    console.log(`🎭 Started listening for: ${playlist.showName}`);

    // Endast för VoiceOver!
    if (isVoiceOverRunning) {
      announceForAccessibility(
        "Lyssningsläge har startat. Stäng inte av enheten och lås inte skärmen under föreställningen. För att stoppa, dubbeltryck och håll kvar fingret på skärmen."
      );
    }

  } catch (error) {
    Alert.alert('Error', `Failed to start show: ${error}`, [{ text: 'OK' }]);
  }
};


  const exitTheaterMode = async () => {
    await KeepAwake.deactivateKeepAwake(); // KORREKT anrop!
    StatusBar.setHidden(false);
    setTheaterMode(false);
    setCurrentShow(null);
    setShowExitDialog(false);
    setLongPressProgress(0);
    cueSimulator.stopSimulation();
    console.log('🛑 Show stopped');
  };

  const cancelExit = () => setShowExitDialog(false);

  return {
    theaterMode,
    currentShow,
    showExitDialog,
    longPressProgress,
    startShow,
    exitTheaterMode,
    cancelExit,
    handleLongPressStart,
    handleLongPressEnd,
    showExitDialogWithFocus,
  };
}
