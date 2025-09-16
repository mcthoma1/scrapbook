// SUMMARY: One album's page. Shows only the photos in this album in a 2-column grid.

import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import type { MediaItem, Album } from '../../src/lib/types';
import { getAlbumById, listMemoriesByAlbum } from '../../src/lib/db';
import MemoryCard from '../../src/components/MemoryCard';

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const albumId = Number(params.id);
  const [album, setAlbum] = useState<Album | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    (async () => {
      if (!Number.isFinite(albumId)) return;
      setAlbum(await getAlbumById(albumId));
      setItems(await listMemoriesByAlbum(albumId));
    })();
  }, [albumId]);

  const renderItem = ({ item }: { item: MediaItem }) => (
    <Link href={`/memory/${item.id}`} asChild>
      <MemoryCard item={item} />
    </Link>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{album?.name ?? 'Album'}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No photos in this album yet</Text>
          <Text style={styles.emptyBody}>Add some from the Home screen, then assign them here (coming next).</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600' },

  grid: { paddingHorizontal: 8, paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
