// mobile/app/memory/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MediaItem } from '../../src/lib/types';
import { getMemoryById, deleteMemoryById } from '../../src/lib/db';
import { deleteFileIfExists } from '../../src/lib/fs';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const m = await getMemoryById(String(id));
      if (mounted) {
        setItem(m);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onDelete = useCallback(() => {
    if (!item) return;
    Alert.alert(
      'Delete photo?',
      'This will remove it from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemoryById(item.id);
              await deleteFileIfExists(item.uri);
              router.back();
            } catch (e) {
              console.warn('delete error', e);
              Alert.alert('Delete failed', 'Could not delete this item. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [item, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Memory not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const date = new Date(item.createdAt);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Image
        source={{ uri: item.uri }}
        style={{ width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 12 }}
        resizeMode="cover"
      />
      <Text style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
        Saved on {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </Text>

      <Button
        title="Delete"
        color={Platform.OS === 'ios' ? '#cc3b3b' : undefined}
        onPress={onDelete}
      />
    </ScrollView>
  );
}