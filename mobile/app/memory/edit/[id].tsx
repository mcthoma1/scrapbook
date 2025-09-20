import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { getMemoryById, updateMemory } from "../../../src/lib/db";
import type { Memory } from "../../../src/lib/types";

export default function EditMemoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", caption: "", date: "", tags: "" });

  useEffect(() => {
    (async () => {
      if (!id || typeof id !== "string") return;
      const data = await getMemoryById(id);
      if (data) {
        setMemory(data);
        setForm({
          title: data.title,
          caption: data.caption ?? "",
          date: data.memoryDate,
          tags: data.tags.join(", "),
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async () => {
    if (!memory) return;
    if (!form.title.trim()) {
      Alert.alert("Title required", "Please add a title for this memory.");
      return;
    }
    try {
      setSaving(true);
      await updateMemory(memory.id, {
        title: form.title.trim(),
        caption: form.caption.trim(),
        memoryDate: form.date,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      });
      router.push({ pathname: "/album/[id]", params: { id: memory.albumId } });
    } catch (error) {
      console.warn("edit memory error", error);
      Alert.alert("Could not save changes", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FB7185" />
      </View>
    );
  }

  if (!memory) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 16 }}>
          Memory not found
        </Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryLabel}>Go Back</Text>
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
        <Text style={styles.heading}>Edit Memory</Text>
      </View>

      {memory.mediaType !== "text" && memory.mediaUri ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Original media cannot be changed.</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.caption}
          onChangeText={(text) => setForm((prev) => ({ ...prev, caption: text }))}
          multiline
          placeholder="Share the story behind this moment"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={(text) => setForm((prev) => ({ ...prev, date: text }))}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          value={form.tags}
          onChangeText={(text) => setForm((prev) => ({ ...prev, tags: text }))}
          placeholder="family, vacation"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.primaryLabel}>{saving ? "Saving..." : "Save Changes"}</Text>
      </Pressable>
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
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  preview: {
    backgroundColor: "#FFE4E6",
    padding: 16,
    borderRadius: 18,
  },
  previewLabel: {
    color: "#FB7185",
    fontWeight: "600",
    textAlign: "center",
  },
  field: {
    gap: 8,
  },
  label: {
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
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#FB7185",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  secondaryLabel: {
    color: "#6B7280",
    fontWeight: "600",
  },
});
