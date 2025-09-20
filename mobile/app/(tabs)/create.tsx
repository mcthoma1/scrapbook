import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useUser } from "../../src/contexts/UserContext";
import {
  createMemory,
  getAlbumById,
  listAlbumsForUser,
} from "../../src/lib/db";
import { copyIntoMediaDir } from "../../src/lib/fs";
import type { Album } from "../../src/lib/types";

export default function CreateMemoryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [mediaType, setMediaType] = useState<"photo" | "video" | "voice" | "text">("photo");
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tagsInput, setTagsInput] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const memberships = await listAlbumsForUser(user.email);
    const details: Album[] = [];
    for (const membership of memberships) {
      const album = await getAlbumById(membership.albumId);
      if (album) details.push(album);
    }
    setAlbums(details);
    setAlbumId(details[0]?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const pickMedia = async (mode: "photo" | "video") => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to continue.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mode === "photo"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setBusy(true);
      const copied = await copyIntoMediaDir({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
      setMediaUri(copied);
      setMediaType(mode);
      setStep(3);
    } catch (error) {
      console.warn("pick media error", error);
      Alert.alert("Could not import media", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !albumId || !title.trim()) return;
    const album = albums.find((a) => a.id === albumId);
    if (!album) {
      Alert.alert("Please choose an album");
      return;
    }
    if (mediaType !== "text" && !mediaUri) {
      Alert.alert("Add your media", "Please select a photo or video before saving.");
      return;
    }
    try {
      setBusy(true);
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      await createMemory({
        albumId: album.id,
        albumTitle: album.title,
        title: title.trim(),
        caption: caption.trim(),
        memoryDate: date,
        mediaType,
        mediaUri,
        tags,
        authorName: user.fullName,
        authorEmail: user.email,
      });
      setTitle("");
      setCaption("");
      setTagsInput("");
      setMediaUri(null);
      setMediaType("photo");
      setStep(1);
      Alert.alert("Memory saved", "Your family memory was added successfully.");
      router.push("/(tabs)");
    } catch (error) {
      console.warn("create memory error", error);
      Alert.alert("Could not save memory", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FB7185" />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Feather name="folder" size={28} color="#FB7185" />
        </View>
        <Text style={styles.emptyTitle}>Create an album first</Text>
        <Text style={styles.emptyBody}>
          You need to be part of an album before you can add memories.
        </Text>
        <Pressable style={styles.primaryAction} onPress={() => router.push("/(tabs)/albums") }>
          <Text style={styles.primaryActionLabel}>Go to Albums</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Memory</Text>
      <Text style={styles.subheading}>Step {step} of 3</Text>

      {step === 1 && (
        <View style={{ gap: 16, marginTop: 24 }}>
          <Pressable style={styles.optionCard} onPress={() => setStep(2)}>
            <Feather name="camera" size={24} color="#FB7185" />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Photo or Video</Text>
              <Text style={styles.optionBody}>Capture a visual moment to share with family.</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.optionCard}
            onPress={() => {
              setMediaType("text");
              setMediaUri(null);
              setStep(3);
            }}
          >
            <Feather name="edit-3" size={24} color="#FB7185" />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Text Story</Text>
              <Text style={styles.optionBody}>Write about a special memory without media.</Text>
            </View>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={{ gap: 16, marginTop: 24 }}>
          <Text style={styles.sectionLabel}>Choose media type</Text>
          <Pressable style={styles.primaryAction} onPress={() => pickMedia("photo")}>
            <Text style={styles.primaryActionLabel}>{busy ? "Importing..." : "Pick a Photo"}</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => pickMedia("video")}>
            <Text style={styles.secondaryActionLabel}>Pick a Video</Text>
          </Pressable>
          <Pressable style={styles.backLink} onPress={() => setStep(1)}>
            <Text style={styles.backLinkLabel}>Back</Text>
          </Pressable>
        </View>
      )}

      {step === 3 && (
        <View style={{ gap: 18, marginTop: 24 }}>
          <Text style={styles.sectionLabel}>Memory details</Text>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Album</Text>
            <View style={styles.albumChips}>
              {albums.map((album) => {
                const selected = album.id === albumId;
                return (
                  <Pressable
                    key={album.id}
                    style={[styles.albumChip, selected && styles.albumChipSelected]}
                    onPress={() => setAlbumId(album.id)}
                  >
                    <Text style={[styles.albumChipLabel, selected && styles.albumChipLabelSelected]}>
                      {album.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Memory title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Caption</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Share the story behind this moment"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="family, vacation, birthday"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable
            style={[styles.primaryAction, (!title.trim() || busy) && styles.primaryActionDisabled]}
            disabled={!title.trim() || busy}
            onPress={handleCreate}
          >
            <Text style={styles.primaryActionLabel}>{busy ? "Saving..." : "Save Memory"}</Text>
          </Pressable>

          <Pressable style={styles.backLink} onPress={() => setStep(1)}>
            <Text style={styles.backLinkLabel}>Start over</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    backgroundColor: "#FFF7ED",
  },
  heading: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FB7185",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.2)",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  optionBody: {
    fontSize: 13,
    color: "#6B7280",
  },
  primaryAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#FB7185",
  },
  primaryActionDisabled: {
    backgroundColor: "#F3F4F6",
  },
  primaryActionLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#FFE4E6",
  },
  secondaryActionLabel: {
    color: "#FB7185",
    fontWeight: "600",
  },
  backLink: {
    alignItems: "center",
    marginTop: 12,
  },
  backLinkLabel: {
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.4)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 14,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  albumChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  albumChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
  },
  albumChipSelected: {
    backgroundColor: "#FB7185",
  },
  albumChipLabel: {
    fontSize: 13,
    color: "#FB7185",
    fontWeight: "600",
  },
  albumChipLabelSelected: {
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: "#FFF7ED",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  emptyBody: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
