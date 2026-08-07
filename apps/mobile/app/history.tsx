import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { absoluteMediaUrl, listSessions } from "@/lib/api";
import { getToken } from "@/lib/authStorage";
import { formatMoney } from "@/lib/format";
import type { HistorySession } from "@/lib/types";

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const token = await getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const rows = await listSessions();
          if (active) setSessions(rows);
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : "Failed to load");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [router]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Your splits</Text>
        <Link href="/" style={styles.newLink}>
          New split
        </Link>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0d6e6e" />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && sessions.length === 0 ? (
        <Text style={styles.empty}>No splits yet — upload a receipt.</Text>
      ) : null}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const uri = absoluteMediaUrl(item.imageUrl);
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/s/${item.id}`)}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={styles.meta}>
                <Text style={styles.merchant}>
                  {item.merchant || "Untitled receipt"}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.total}>
                  {formatMoney(item.grandTotal, item.displayCurrency)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#dfe7db" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#14231f" },
  newLink: {
    color: "#f3f7f4",
    backgroundColor: "#14231f",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontWeight: "600",
  },
  center: { padding: 40, alignItems: "center" },
  error: { color: "#8a3b2b", paddingHorizontal: 16 },
  empty: { color: "#2a4038", paddingHorizontal: 16, marginBottom: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f7f8f4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(20,35,31,0.14)",
    overflow: "hidden",
    marginBottom: 12,
  },
  thumb: { width: 96, height: 96 },
  thumbPlaceholder: { backgroundColor: "#c9ddd4" },
  meta: { flex: 1, padding: 12, justifyContent: "center", gap: 2 },
  merchant: { fontWeight: "700", color: "#14231f", fontSize: 16 },
  date: { color: "#2a4038", fontSize: 13 },
  total: { marginTop: 4, fontWeight: "600", color: "#0a4f4f" },
});
