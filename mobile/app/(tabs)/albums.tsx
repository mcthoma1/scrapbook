import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useUser } from "../../src/contexts/UserContext";
import {
  createAlbum,
  getAlbumById,
  joinAlbumByCode,
  listAlbumsForUser,
} from "../../src/lib/db";
import type { Album, AlbumMembership, UserProfile } from "../../src/lib/types";


function CreateAlbumModal({
  visible,
  onClose,
  onCreated,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (payload: { album: Album; membership: AlbumMembership }) => void;
  user: UserProfile;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    try {
      setBusy(true);
      const result = await createAlbum({
        title: title.trim(),
        description,
        createdBy: user,
      });
      setTitle("");
      setDescription("");
      onCreated(result);
      onClose();
      Alert.alert("Album created", "Your new album is ready for memories!");
    } catch (error) {
      console.warn("create album error", error);
      Alert.alert("Could not create album", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Album</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color="#6B7280" />
            </Pressable>
          </View>

          <TextInput
            style={styles.modalInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Album name"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={[styles.modalInput, { height: 96, textAlignVertical: "top" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <Pressable
            style={[styles.modalAction, (!title.trim() || busy) && styles.modalActionDisabled]}
            disabled={!title.trim() || busy}
            onPress={submit}
          >
            <Text style={styles.modalActionLabel}>{busy ? "Creating..." : "Create"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function JoinAlbumModal({
  visible,
  onClose,
  onJoined,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  onJoined: () => void;
  user: UserProfile;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    try {
      setBusy(true);
      setError("");
      await joinAlbumByCode(cleaned, user);
      setCode("");
      onJoined();
      onClose();
    } catch (err: any) {
      if (err?.message === "ALREADY_MEMBER") {
        setError("You're already a member of this album");
      } else {
        setError("Invalid invite code. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Join Album</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color="#6B7280" />
            </Pressable>
          </View>
          <TextInput
            style={styles.modalInput}
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError("");
            }}
            placeholder="Invite code"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            maxLength={6}
          />
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          <Pressable
            style={[styles.modalAction, (!code.trim() || busy) && styles.modalActionDisabled]}
            disabled={!code.trim() || busy}
            onPress={submit}
          >
            <Text style={styles.modalActionLabel}>{busy ? "Joining..." : "Join"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function AlbumsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [rows, setRows] = useState<{ album: Album; membership: AlbumMembership }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const memberships = await listAlbumsForUser(user.email);
    const data: { album: Album; membership: AlbumMembership }[] = [];
    for (const membership of memberships) {
      const album = await getAlbumById(membership.albumId);
      if (album) {
        data.push({ album, membership });
      }
    }
    setRows(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { album: Album; membership: AlbumMembership }) => (
    <Pressable
      style={styles.albumCard}
      onPress={() => router.push({ pathname: "/album/[id]", params: { id: item.album.id } })}
    >
      <View style={styles.albumCover}>
        <Feather name="users" size={28} color="#FB7185" />
        <Text style={styles.albumCoverLabel}>{item.album.title}</Text>
      </View>
      <Text style={styles.albumTitle}>{item.album.title}</Text>
      {item.album.description ? <Text style={styles.albumDescription}>{item.album.description}</Text> : null}
      <View style={styles.albumMetaRow}>
        <View style={styles.albumMetaItem}>
          <Feather name="users" size={14} color="#F97316" />
          <Text style={styles.albumMetaText}>{item.album.memberCount} members</Text>
        </View>
        <View style={styles.albumMetaItem}>
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text style={styles.albumMetaText}>
            {new Date(item.album.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </Text>
        </View>
      </View>
      {item.membership.role === "owner" ? (
        <View style={styles.albumBadge}>
          <Text style={styles.albumBadgeLabel}>Owner</Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Your Albums</Text>
          <Text style={styles.headerSubtitle}>Private spaces for family memories</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => setShowJoin(true)}>
          <Feather name="user-plus" size={20} color="#FB7185" />
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryAction} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.primaryActionLabel}>Create Album</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => setShowJoin(true)}>
          <Feather name="users" size={18} color="#FB7185" />
          <Text style={styles.secondaryActionLabel}>Join Album</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#FB7185" />

        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="folder" size={28} color="#FB7185" />
          </View>
          <Text style={styles.emptyTitle}>No albums yet</Text>
          <Text style={styles.emptyBody}>
            Create a new album for your family or join with an invite code.
          </Text>

        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.album.id}
          renderItem={({ item }) => renderItem({ item })}
          contentContainerStyle={{ paddingBottom: 120, gap: 16 }}
        />
      )}

      {user ? (
        <CreateAlbumModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={({ album, membership }) => {
            setRows((current) => {
              const withoutNew = current.filter((item) => item.album.id !== album.id);
              return [{ album, membership }, ...withoutNew];
            });
          }}
          user={user}
        />
      ) : null}
      {user ? (
        <JoinAlbumModal
          visible={showJoin}
          onClose={() => setShowJoin(false)}
          onJoined={load}
          user={user}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FDF4FF",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FB7185",
    paddingVertical: 14,
    borderRadius: 18,
  },
  primaryActionLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    paddingVertical: 14,
    borderRadius: 18,
  },
  secondaryActionLabel: {
    color: "#FB7185",
    fontWeight: "600",
  },
  albumCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.2)",
    gap: 12,
  },
  albumCover: {
    height: 120,
    borderRadius: 18,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  albumCoverLabel: {
    color: "#FB7185",
    fontWeight: "600",
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  albumDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  albumMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  albumMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  albumMetaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  albumBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE4E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  albumBadgeLabel: {
    fontSize: 12,
    color: "#FB7185",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.4)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  modalAction: {
    backgroundColor: "#FB7185",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalActionDisabled: {
    backgroundColor: "#F3F4F6",
  },
  modalActionLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  modalError: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
  },

});
