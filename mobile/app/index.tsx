import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FlatList, Image, Platform, Pressable, SafeAreaView, StatusBar, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { useRouter, type Href } from 'expo-router';

type MediaItem = { id: string; uri: string; createdAt: number };

const db: SQLiteDatabase = openDatabaseSync('scrapbook.db');

export default function Index() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY NOT NULL,
            uri TEXT NOT NULL,
            createdAt INTEGER NOT NULL
          );
        `);
        const rows = await db.getAllAsync<MediaItem>(
          'SELECT id, uri, createdAt FROM media ORDER BY createdAt DESC;'
        );
        setItems(rows);
      } catch (e) {
        console.warn('db init/load error', e);
      }
    })();
  }, []);

  const pickAndSave = useCallback(async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled) return;

      const asset = res.assets[0];

      const baseDir = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory) as string;
      if (!baseDir) throw new Error('No writable base directory available');
      const dir = baseDir + 'media/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const nameFromAsset = asset.fileName ?? `image_${Date.now()}`;
      const fromNameExt = nameFromAsset.includes('.') ? nameFromAsset.split('.').pop() : undefined;
      const fromMimeExt = asset.mimeType && asset.mimeType.includes('/') ? asset.mimeType.split('/').pop() : undefined;
      const ext = (fromNameExt || fromMimeExt || 'jpg').toLowerCase();
      const filename = `${Date.now()}.${ext}`;
      const to = dir + filename;

      await FileSystem.copyAsync({ from: asset.uri, to });

      const id = String(Date.now());
      const createdAt = Date.now();
      await db.runAsync(
        'INSERT INTO media (id, uri, createdAt) VALUES (?, ?, ?);',
        [id, to, createdAt]
      );

      setItems((prev) => [{ id, uri: to, createdAt }, ...prev]);
    } catch (e) {
      console.warn('pickAndSave error', e);
    }
  }, []);

  const deleteItem = useCallback(async (item: MediaItem) => {
    try {
      await db.runAsync('DELETE FROM media WHERE id = ?;', [item.id]);
      await FileSystem.deleteAsync(item.uri, { idempotent: true });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      console.warn('delete error', e);
      Alert.alert('Delete failed', 'Could not delete this item. Please try again.');
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <View style={{ padding: 12 }}>
        <Button title="Add Photo (save to device)" onPress={pickAndSave} />

        <View style={{ height: 8 }} />
        <Button
          title="Clear list (keeps files)"
          onPress={() => {
            (async () => {
              try {
                await db.runAsync('DELETE FROM media;');
                setItems([]);
              } catch (e) {
                console.warn('clear list error', e);
              }
            })();
          }}
          color={Platform.OS === 'ios' ? '#888' : undefined}
        />

        {items.length === 0 ? (
          <Text style={{ marginTop: 16 }}>
            Pick an image to save it privately to this app’s storage.
          </Text>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingVertical: 16 }}
            data={items}
            keyExtractor={(it) => it.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1, marginBottom: 12 }}>
                  <Pressable onPress={() => router.push(`/memory/${item.id}` as Href)}>
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 8 }}
                  />
                </Pressable>
                <Button
                  title="Delete"
                  color={Platform.OS === 'ios' ? '#cc3b3b' : undefined}
                  onPress={() =>
                    Alert.alert('Delete photo?', 'This will remove it from the app.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => void deleteItem(item) },
                    ])
                  }
                />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
