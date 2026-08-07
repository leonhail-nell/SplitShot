import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SplitEditor } from "@/components/SplitEditor";
import { getSession } from "@/lib/api";
import { colors, type } from "@/lib/theme";
import type { SessionPayload } from "@/lib/types";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const payload = await getSession(id);
        if (!cancelled) setSession(payload);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Session not found");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Split", headerShown: false }} />
      {!session && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Loading split…</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {session ? <SplitEditor initial={session} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  muted: { ...type.body, textAlign: "center" },
  error: { ...type.error, textAlign: "center" },
});
