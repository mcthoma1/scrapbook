// SUMMARY: One grid card: image + soft bottom overlay showing title or date.

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MediaItem } from '../lib/types';

type Props = {
  item: MediaItem;
  onPress?: () => void;
  onLongPress?: () => void;
  showCaption?: boolean; // default true
};

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return '';
  }
}

export default function MemoryCard({ item, onPress, onLongPress, showCaption = true }: Props) {
  const caption = item.title || formatDate(item.createdAt);

  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <Image source={{ uri: item.uri }} style={styles.thumb} />
      {showCaption && (
        <View style={styles.overlayWrap}>
          <View style={styles.overlay} />
          <Text numberOfLines={1} style={styles.caption}>{caption}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  thumb: { width: '100%', height: '100%' },
  overlayWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  overlay: { ...StyleSheet.absoluteFillObject, height: 40, backgroundColor: 'rgba(0,0,0,0.28)' },
  caption: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
