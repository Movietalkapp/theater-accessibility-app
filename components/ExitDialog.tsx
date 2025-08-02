// components/ExitDialog.tsx
import React, { useRef } from 'react';
import { Modal, View as RNView, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface ExitDialogProps {
  visible: boolean;
  onExit: () => void;
  onCancel: () => void;
}

export default function ExitDialog({ visible, onExit, onCancel }: ExitDialogProps) {
  const exitButtonRef = useRef<TouchableOpacity>(null);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <RNView style={styles.exitDialogOverlay}>
        <RNView style={styles.exitDialogContainer}>
          <Text
            style={styles.dialogTitle}
            accessibilityRole="header"
            accessible={true}
          >
            Vill du avsluta föreställningen?
          </Text>
          
          <TouchableOpacity
            ref={exitButtonRef}
            style={styles.exitButton}
            onPress={onExit}
            accessible={true}
            accessibilityLabel="Stoppa föreställning"
            accessibilityHint="Avsluta lyssningsläge och återgå till listan"
            accessibilityRole="button"
          >
            <Text style={styles.exitButtonText}>Stoppa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            accessible={true}
            accessibilityLabel="Fortsätt lyssna"
            accessibilityHint="Fortsätt lyssna på föreställningen"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Fortsätt</Text>
          </TouchableOpacity>
        </RNView>
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  exitDialogOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitDialogContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  dialogTitle: {
    color: '#fff', 
    fontSize: 18, 
    marginBottom: 24, 
    textAlign: 'center',
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 20,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555555',
    minWidth: 140,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
