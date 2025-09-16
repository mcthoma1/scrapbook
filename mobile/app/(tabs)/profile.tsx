import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useUser } from "../../src/contexts/UserContext";
import { login, logout, updateCurrentUser } from "../../src/lib/db";
import type { UserProfile } from "../../src/lib/types";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshUser, setUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", familyRole: "", bio: "" });
  const [notifications, setNotifications] = useState({ newMemories: true, newComments: true });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        familyRole: user.familyRole ?? "",
        bio: user.bio ?? "",
      });
      setNotifications(user.notificationPrefs);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const updated = await updateCurrentUser({
        fullName: form.fullName,
        familyRole: form.familyRole,
        bio: form.bio,
        notificationPrefs: notifications,
      } as Partial<UserProfile>);
      setForm({
        fullName: updated.fullName,
        familyRole: updated.familyRole ?? "",
        bio: updated.bio ?? "",
      });
      setNotifications(updated.notificationPrefs);
      setEditing(false);
      await refreshUser();
    } catch (error) {
      console.warn("profile save error", error);
      Alert.alert("Could not save profile", "Please try again.");
    }
  };

  const toggleNotification = async (key: "newMemories" | "newComments") => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try {
      await updateCurrentUser({ notificationPrefs: next } as Partial<UserProfile>);
      await refreshUser();
    } catch (error) {
      console.warn("toggle notification error", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    const profile = await login();
    setUser(profile);
    router.push("/(tabs)");
  };

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{user.fullName?.charAt(0) ?? "U"}</Text>
          </View>
          <Pressable style={styles.avatarButton}>
            <Feather name="camera" size={16} color="#FB7185" />
          </Pressable>
        </View>

        {editing ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(text) => setForm((prev) => ({ ...prev, fullName: text }))}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              value={form.familyRole}
              onChangeText={(text) => setForm((prev) => ({ ...prev, familyRole: text }))}
              placeholder="Family role (Mom, Dad, etc.)"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.bio}
              onChangeText={(text) => setForm((prev) => ({ ...prev, bio: text }))}
              placeholder="Tell your family a bit about yourself"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <View style={styles.editActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setEditing(false)}>
                <Text style={styles.secondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={handleSave}>
                <Text style={styles.primaryLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={styles.name}>{user.fullName}</Text>
            {user.familyRole ? <Text style={styles.role}>{user.familyRole}</Text> : null}
            {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
            <Pressable style={styles.secondaryBtn} onPress={() => setEditing(true)}>
              <Text style={styles.secondaryLabel}>Edit Profile</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Feather name="settings" size={18} color="#FB7185" />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>New Memory Alerts</Text>
            <Text style={styles.switchSubtitle}>Get notified when family shares something new.</Text>
          </View>
          <Switch
            value={notifications.newMemories}
            onValueChange={() => toggleNotification("newMemories")}
            trackColor={{ true: "#FB7185" }}
          />
        </View>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Comment Alerts</Text>
            <Text style={styles.switchSubtitle}>Stay updated when someone comments.</Text>
          </View>
          <Switch
            value={notifications.newComments}
            onValueChange={() => toggleNotification("newComments")}
            trackColor={{ true: "#FB7185" }}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Email</Text>
          <Text style={styles.accountValue}>{user.email}</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Member since</Text>
          <Text style={styles.accountValue}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color="#EF4444" />
        <Text style={styles.logoutLabel}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#FEF3C7",
    gap: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FB7185",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  avatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.4)",
  },
  formContainer: {
    width: "100%",
    gap: 12,
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#FB7185",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryLabel: {
    color: "#6B7280",
    fontWeight: "600",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  role: {
    fontSize: 14,
    color: "#FB7185",
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  switchSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    maxWidth: 220,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountLabel: {
    color: "#6B7280",
  },
  accountValue: {
    fontWeight: "600",
    color: "#111827",
  },
  logoutBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutLabel: {
    color: "#EF4444",
    fontWeight: "600",
  },
});
