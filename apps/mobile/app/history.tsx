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
import { colors, fonts, type } from "@/lib/theme";
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
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.messageWrap}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {!loading ? (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            sessions.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <Text style={styles.empty}>No splits yet — upload a receipt.</Text>
          }
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
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { ...type.pageTitle },
  newLink: {
    color: colors.onInk,
    backgroundColor: colors.ink,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
  },
  center: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messageWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: "center",
  },
  error: { ...type.error, textAlign: "center" },
  empty: {
    ...type.body,
    textAlign: "center",
  },
  list: { padding: 16, gap: 12 },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.sheet,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumb: { width: 96, height: 96 },
  thumbPlaceholder: { backgroundColor: "#c9ddd4" },
  meta: { flex: 1, padding: 12, justifyContent: "center", gap: 2 },
  merchant: { ...type.strong },
  date: { ...type.muted },
  total: {
    marginTop: 4,
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    color: colors.accentDeep,
  },
});
