import React, { useEffect, useRef } from 'react';
import { Modal, TouchableOpacity, View, Text, AccessibilityInfo, findNodeHandle, StyleSheet } from 'react-native';

interface StartModalProps {
  visible: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export default function StartModal({ visible, onStart, onCancel }: StartModalProps) {
  const startButtonRef = useRef<TouchableOpacity>(null);

  // Sätt VO-fokus på start-knappen när modalen öppnas
  useEffect(() => {
    if (visible && startButtonRef.current) {
      const node = findNodeHandle(startButtonRef.current);
      if (node) {
        setTimeout(() => {
          AccessibilityInfo.setAccessibilityFocus(node);
        }, 500);
      }
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Visuell info (ej för VO) */}
          <Text
            style={styles.infoText}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            Under föreställningen:{"\n"}Stäng inte av enheten!{"\n"}Lås inte skärmen!{"\n\n"}
            För att avsluta, håll fingret på skärmen tills frågan visas.
          </Text>

          <TouchableOpacity
            ref={startButtonRef}
            style={styles.startButton}
            onPress={onStart}
            accessible={true}
            accessibilityLabel={
              "Start! Stäng inte av enheten, och lås inte skärmen under föreställningen. " +
              "För att avsluta, dubbeltryck och håll fingret på skärmen tills frågan visas. " +
              "Start. "
            }
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            accessible={true}
            accessibilityLabel="Avbryt"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Avbryt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 46,
    paddingHorizontal: 34,
    backgroundColor: '#181818',
    borderRadius: 18,
    minWidth: 320,
    maxWidth: 420,
    elevation: 10,
  },
  infoText: {
    color: '#ffe066',
    opacity: 0.68,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 360,
  },
  startButton: {
    backgroundColor: '#ffe066',
    paddingVertical: 20,
    paddingHorizontal: 56,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
  },
  startButtonText: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: '#444',
    paddingVertical: 16,
    paddingHorizontal: 46,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
