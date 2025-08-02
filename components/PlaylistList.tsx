// components/PlaylistList.tsx
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  AccessibilityInfo,
  Text,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PlaylistMetadata } from '../src/types';

interface PlaylistListProps {
  playlists: PlaylistMetadata[];
  onStartShow: (playlistId: string, showName: string) => void; // Uppdaterad signatur!
  onDeletePlaylist: (playlistId: string, showName: string) => void;
}

interface PlaylistItemProps {
  item: PlaylistMetadata;
  onStartShow: (playlistId: string, showName: string) => void; // Uppdaterad signatur!
  onDeletePlaylist: (playlistId: string, showName: string) => void;
}

function PlaylistItem({ item, onStartShow, onDeletePlaylist }: PlaylistItemProps) {
  const handleDelete = () => {
    Alert.alert(
      "Ta bort föreställning",
      `Är du säker på att du vill ta bort "${item.showName}"? Denna åtgärd kan inte ångras.`,
      [
        {
          text: "Avbryt",
          style: "cancel",
          onPress: () => {
            AccessibilityInfo.announceForAccessibility("Borttagning avbruten");
          },
        },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: () => {
            onDeletePlaylist(item.playlistId, item.showName);
            AccessibilityInfo.announceForAccessibility(item.showName + " har tagits bort");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.playlistItemContainer}>
      {/* Spellistkortet */}
      <TouchableOpacity
        style={styles.showCard}
        onPress={() => onStartShow(item.playlistId, item.showName)} // Skickar med namn!
        accessible={true}
        accessibilityLabel={`Starta ${item.showName}`}
        accessibilityHint="Startar föreställningen"
        accessibilityRole="button"
      >
        <Text style={styles.showTitle}>{item.showName}</Text>
      </TouchableOpacity>

      {/* Radera-knapp – nu med FontAwesome trash-ikon */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        accessible={true}
        accessibilityLabel={`Ta bort ${item.showName}`}
        accessibilityHint="Tar bort föreställningen permanent från appen"
        accessibilityRole="button"
      >
        <FontAwesome name="trash" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function PlaylistList({
  playlists,
  onStartShow,
  onDeletePlaylist,
}: PlaylistListProps) {
  if (playlists.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={styles.emptyTitle}
          accessible={true}
          accessibilityRole="header"
        >
          Inga föreställningar
        </Text>
        <Text
          style={styles.emptyText}
          accessible={true}
        >
          Ladda ner en föreställning via länk från teatern
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={playlists}
      keyExtractor={(item) => item.playlistId}
      renderItem={({ item }) => (
        <PlaylistItem
          item={item}
          onStartShow={onStartShow}
          onDeletePlaylist={onDeletePlaylist}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      accessible={false}
      removeClippedSubviews={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  playlistItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  showCard: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'center',
    minHeight: 60,
    marginRight: 12,
  },
  showTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c0392b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
});
