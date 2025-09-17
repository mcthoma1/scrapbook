import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import MemoryCard from "../../src/components/MemoryCard";
import { useUser } from "../../src/contexts/UserContext";
import { deleteMemory, listMemoriesForUser } from "../../src/lib/db";
import type { Memory } from "../../src/lib/types";
import { deleteFileIfExists } from "../../src/lib/fs";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await listMemoriesForUser(user.email);
    setMemories(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const data = await listMemoriesForUser(user.email);
    setMemories(data);
    setRefreshing(false);
  }, [user]);

  const handleUpdated = () => {
    load();
  };

  const handleDelete = async (item: Memory) => {
    try {
      await deleteMemory(item.id);
      if (item.mediaUri) {
        await deleteFileIfExists(item.mediaUri);
      }
      load();
    } catch (error) {
      console.warn("delete memory error", error);
      Alert.alert("Could not delete memory", "Please try again.");
    }
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="image" size={28} color="#FB7185" />
      </View>
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptyBody}>
        Join a family album or create your first memory to start filling the feed.
      </Text>
      <Text style={styles.emptyLink} onPress={() => router.push("/(tabs)/create")}>Create a memory</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB7185" />}
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Feather name="heart" size={20} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Family Memories</Text>
        <Text style={styles.heroSubtitle}>Catch up on your family’s latest moments</Text>
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#FB7185" />
        </View>
      ) : memories.length === 0 ? (
        emptyState
      ) : (
        <View style={{ gap: 18 }}>
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              currentUser={user!}
              onUpdated={handleUpdated}
              onRequestEdit={(item) => router.push({ pathname: "/memory/edit/[id]", params: { id: item.id } })}
              onRequestDelete={handleDelete}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
  },
  hero: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FB7185",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyBody: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FB7185",
  },
});
