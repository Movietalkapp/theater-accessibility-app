// hooks/useAccessibility.ts
import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useAccessibility() {
  const [isVoiceOverRunning, setIsVoiceOverRunning] = useState(false);

  useEffect(() => {
    const checkVoiceOver = async () => {
      const isRunning = await AccessibilityInfo.isScreenReaderEnabled();
      setIsVoiceOverRunning(isRunning);
    };
    
    checkVoiceOver();
    
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged', 
      setIsVoiceOverRunning
    );
    
    return () => subscription?.remove();
  }, []);

  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const setAccessibilityFocus = (nodeHandle: number) => {
    AccessibilityInfo.setAccessibilityFocus(nodeHandle);
  };

  return {
    isVoiceOverRunning,
    announceForAccessibility,
    setAccessibilityFocus,
  };
}