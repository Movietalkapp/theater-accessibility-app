// src/types/index.ts - ENDAST TYPESCRIPT TYPES
export interface PlaylistMetadata {
  playlistId: string;
  theaterName: string;
  showName: string;
  version: string;
  downloadedAt: string;
}

export interface CueAction {
  type: 'tts' | 'audio' | 'video' | 'text' | 'subtitle';
  text?: string;
  file?: string;
  language?: string;
  delay?: number;
  volume?: number;
}

export interface PlaylistCue {
  id: string;
  actions: CueAction[];
}

export interface Playlist {
  playlistId: string;
  theaterName: string;
  showName: string;
  version: string;
  bleUUID: string;
  checksum: string;
  cues: PlaylistCue[];
  mediaFiles: string[];
  createdAt: string;
}