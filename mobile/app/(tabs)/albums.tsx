// SUMMARY: Albums tab. Local-only (no accounts, no join codes).
// Lists albums from SQLite and lets you create one. Tapping opens /album/[id].

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";

import type { Album } from "../../src/lib/types";
import { createAlbum, listAlbums } from "../../src/lib/db";

function CreateAlbumModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const name = title.trim();
    if (!name) {
      Alert.alert("Album name required", "Type a name, then tap Create.");
      return;
    }
    if (busy) return;

    try {
      setBusy(true);
      Keyboard.dismiss();
      // ✅ MOBILE DB signature: createAlbum(name: string) -> id
      await createAlbum(name);
      setTitle("");
      onCreated();
      onClose();
      Alert.alert("Album created", "Your new album is ready.");
    } catch (e) {
      console.warn("create album error", e);
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
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={submit}
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

export default function AlbumsScreen() {
  const [rows, setRows] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAlbums();
      setRows(data);
    } catch (e) {
      console.warn("[Albums] list error", e);
      Alert.alert("Error", "Could not load albums.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: Album }) => (
    <Link href={`/album/${item.id}`} asChild>
      <Pressable style={styles.albumCard}>
        <View style={styles.albumCover}>
          <Feather name="folder" size={28} color="#FB7185" />
          <Text style={styles.albumCoverLabel}>{item.name}</Text>
        </View>
        <Text style={styles.albumTitle}>{item.name}</Text>
        <View style={styles.albumMetaRow}>
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text style={styles.albumMetaText}>
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Your Albums</Text>
          <Text style={styles.headerSubtitle}>Private, on-device collections</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={20} color="#FB7185" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="folder" size={28} color="#FB7185" />
          </View>
          <Text style={styles.emptyTitle}>No albums yet</Text>
          <Text style={styles.emptyBody}>Create your first album to group your memories.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
        />
      )}

      <CreateAlbumModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FDF4FF", paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6B7280" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFE4E6", alignItems: "center", justifyContent: "center" },

  albumCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "rgba(244,114,182,0.2)", gap: 12 },
  albumCover: { height: 120, borderRadius: 18, backgroundColor: "#FFE4E6", alignItems: "center", justifyContent: "center", gap: 10 },
  albumCoverLabel: { color: "#FB7185", fontWeight: "600" },
  albumTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  albumMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  albumMetaText: { fontSize: 13, color: "#6B7280" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#FFE4E6", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  emptyBody: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, gap: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalInput: { borderWidth: 1, borderColor: "rgba(244,114,182,0.4)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#111827" },
  modalAction: { backgroundColor: "#FB7185", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  modalActionDisabled: { backgroundColor: "#F3F4F6" },
  modalActionLabel: { color: "#fff", fontWeight: "600" },
});
