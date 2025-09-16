// SUMMARY: Albums screen. See all albums and create a new one.

import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import type { Album } from '../../src/lib/types';
import { createAlbum, listAlbums } from '../../src/lib/db';

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => setAlbums(await listAlbums()))();
  }, []);

  async function onCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Album name required');
      return;
    }
    try {
      setBusy(true);
      const id = await createAlbum(trimmed);
      setName('');
      setAlbums(await listAlbums());
    } catch (e) {
      console.warn('create album error', e);
      Alert.alert('Could not create album');
    } finally {
      setBusy(false);
    }
  }

  const renderItem = ({ item }: { item: Album }) => (
    <Link href={`/albums/${item.id}`} asChild>
      <Pressable style={styles.albumRow}>
        <Text style={styles.albumName}>{item.name}</Text>
        <Text style={styles.albumMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Albums</Text>
      </View>

      <View style={styles.createRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New album name"
          style={styles.input}
        />
        <Pressable style={[styles.createBtn, busy && styles.disabled]} onPress={onCreate} disabled={busy}>
          <Text style={styles.createLabel}>{busy ? 'Creating…' : 'Create'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={albums}
        keyExtractor={(a) => String(a.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600' },

  createRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  createBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#111827', borderRadius: 10 },
  createLabel: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.6 },

  albumRow: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  albumName: { fontSize: 16, fontWeight: '600' },
  albumMeta: { fontSize: 12, color: '#6B7280' },
});
