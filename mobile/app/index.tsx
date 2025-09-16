// SUMMARY: Home screen. Shows your local gallery, lets you add a photo from the device,
// and delete on long-press. Everything stays on-device (no uploads).
// This version also adds an "Albums" button in the header and uses <MemoryCard> for each tile.

import MemoryCard from '../src/components/MemoryCard';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';

import { listMemories, insertMemory, deleteMemoryById } from '../src/lib/db';
import type { MediaItem } from '../src/lib/types';
import { copyIntoMediaDir, deleteFileIfExists } from '../src/lib/fs';

export default function HomeScreen() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  // 1) On load, ask the DB for rows and show them newest-first.
  useEffect(() => {
    (async () => {
      const rows = await listMemories();
      setItems(rows);
    })();
  }, []);

  // 2) Add flow: ask permission -> pick -> copy into private folder -> save a DB row -> update list.
  const pickAndAdd = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled) return;

      setBusy(true);
      const asset = result.assets[0];

      // Coerce possible nulls from ImagePicker to undefined so types line up.
      const to = await copyIntoMediaDir({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });

      const id = String(Date.now());
      const createdAt = Date.now();
      await insertMemory({ id, uri: to, createdAt });

      // Optimistic update (fast). Alternatively, re-run listMemories().
      setItems(prev => [{ id, uri: to, createdAt }, ...prev]);
    } catch (e) {
      console.warn('pick-and-add error', e);
      Alert.alert('Could not add photo', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  // 3) Delete flow: confirm -> delete file (safe) -> delete DB row -> update list.
  const deleteItem = useCallback(async (item: MediaItem) => {
    Alert.alert('Delete photo?', 'This will remove it from the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFileIfExists(item.uri);
            await deleteMemoryById(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch (e) {
            console.warn('delete error', e);
            Alert.alert('Delete failed', 'Could not delete this item. Please try again.');
          }
        },
      },
    ]);
  }, []);

  // 4) Each square: tap opens detail; long-press deletes. Use MemoryCard for the tile UI.
  const renderItem = ({ item }: { item: MediaItem }) => (
    <Link href={`/memory/${item.id}`} asChild>
      <MemoryCard item={item} onLongPress={() => deleteItem(item)} />
    </Link>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with title, Albums button, and Add Photo button */}
      <View style={styles.header}>
        <Text style={styles.title}>Scrapbook</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Link href="/albums" asChild>
            <Pressable style={styles.secondaryBtn}>
              <Text style={styles.secondaryLabel}>Albums</Text>
            </Pressable>
          </Link>
          <Pressable style={[styles.addBtn, busy && styles.addBtnDisabled]} onPress={pickAndAdd} disabled={busy}>
            <Text style={styles.addLabel}>{busy ? 'Adding…' : 'Add Photo'}</Text>
          </Pressable>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptyBody}>Add your first photo. Everything stays on this device.</Text>
          <Pressable style={styles.addBtn} onPress={pickAndAdd} disabled={busy}>
            <Text style={styles.addLabel}>{busy ? 'Adding…' : 'Add Photo'}</Text>
          </Pressable>
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

  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '600' },

  // New secondary button for "Albums"
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#E5E7EB', borderRadius: 10 },
  secondaryLabel: { color: '#111827', fontWeight: '600' },

  // Add Photo button
  addBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#111827', borderRadius: 10 },
  addBtnDisabled: { opacity: 0.6 },
  addLabel: { color: '#fff', fontWeight: '600' },

  // Grid padding
  grid: { paddingHorizontal: 8, paddingBottom: 24 },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
