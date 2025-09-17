import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView } from "react-native";

import { UserContext } from "../src/contexts/UserContext";
import { getCurrentUser } from "../src/lib/db";
import type { UserProfile } from "../src/lib/types";

export default function RootLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [booting, setBooting] = useState(true);

  const loadUser = useCallback(async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  }, []);

  useEffect(() => {
    (async () => {
      await loadUser();
      setBooting(false);
    })();
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  if (booting) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FB7185" />
      </SafeAreaView>
    );
  }

  return (
    <UserContext.Provider value={{ user, refreshUser, setUser }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="album/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="memory/edit/[id]" options={{ headerTitle: "Edit Memory" }} />
      </Stack>
    </UserContext.Provider>
  );
}
