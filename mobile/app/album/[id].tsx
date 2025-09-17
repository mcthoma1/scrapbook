import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import MemoryCard from "../../src/components/MemoryCard";
import { useUser } from "../../src/contexts/UserContext";
import {
  deleteMemory,
  getAlbumById,
  getAlbumInviteCode,
  listAlbumMembers,
  listMemoriesByAlbum,
} from "../../src/lib/db";
import { deleteFileIfExists } from "../../src/lib/fs";
import type { Album, AlbumMembership, Memory } from "../../src/lib/types";

export default function AlbumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [album, setAlbum] = useState<Album | null>(null);
  const [members, setMembers] = useState<AlbumMembership[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState("Copy");

  const load = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    const albumData = await getAlbumById(id);
    const memberData = await listAlbumMembers(id);
    const memoryData = await listMemoriesByAlbum(id);
    const code = await getAlbumInviteCode(id);
    setAlbum(albumData);
    setMembers(memberData);
    setMemories(memoryData);
    setInviteCode(code);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCopy = () => {
    if (!inviteCode) return;
    setCopyState("Copied!");
    setTimeout(() => setCopyState("Copy"), 1500);
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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FB7185" />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>Album not found</Text>
        <Pressable style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={styles.primaryLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.circleBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#6B7280" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{album.title}</Text>
          <Text style={styles.subtitle}>
            {memories.length} {memories.length === 1 ? "memory" : "memories"} • {members.length} {" "}
            {members.length === 1 ? "member" : "members"}
          </Text>
        </View>
        <Pressable style={styles.circleBtn} onPress={() => router.push("/(tabs)/create") }>
          <Feather name="plus" size={20} color="#FB7185" />
        </Pressable>
      </View>

      <Pressable style={styles.inviteToggle} onPress={() => setShowInvite((prev) => !prev)}>
        <Feather name="lock" size={16} color="#FB7185" />
        <Text style={styles.inviteToggleLabel}>Invite code</Text>
        <Feather name={showInvite ? "chevron-up" : "chevron-down"} size={16} color="#FB7185" />
      </Pressable>

      {showInvite && inviteCode && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Pressable style={styles.copyBtn} onPress={handleCopy}>
            <Feather name="copy" size={16} color="#fff" />
            <Text style={styles.copyLabel}>{copyState}</Text>
          </Pressable>
        </View>
      )}

      {album.description ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionBody}>{album.description}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Members ({members.length})</Text>
        <View style={{ gap: 12 }}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{member.userName?.charAt(0) ?? "U"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.userName}</Text>
                <Text style={styles.memberMeta}>
                  Joined {new Date(member.joinedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              {member.role === "owner" ? <Text style={styles.memberBadge}>Owner</Text> : null}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Memories</Text>
          <Pressable style={styles.linkBtn} onPress={() => router.push("/(tabs)/create") }>
            <Text style={styles.linkLabel}>Add Memory</Text>
          </Pressable>
        </View>
        {memories.length === 0 ? (
          <Text style={styles.emptyText}>No memories yet. Be the first to add one!</Text>
        ) : (
          <View style={{ gap: 20 }}>
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                currentUser={user!}
                onUpdated={load}
                onRequestDelete={handleDelete}
                onRequestEdit={(item) => router.push({ pathname: "/memory/edit/[id]", params: { id: item.id } })}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#FFF7ED",
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.3)",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  inviteToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFE4E6",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteToggleLabel: {
    color: "#FB7185",
    fontWeight: "600",
  },
  inviteCard: {
    marginTop: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#111827",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FB7185",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sectionBody: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FB7185",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  memberMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFE4E6",
    color: "#FB7185",
    fontWeight: "600",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkLabel: {
    color: "#FB7185",
    fontWeight: "600",
  },
  emptyText: {
    color: "#6B7280",
    fontStyle: "italic",
  },
  primaryBtn: {
    backgroundColor: "#FB7185",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
