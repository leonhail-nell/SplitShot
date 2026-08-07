import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UploadButton } from "@/components/UploadButton";
import { createSession, ensurePushRegistered, logout, parseReceipt } from "@/lib/api";
import { getStoredUser, getToken } from "@/lib/authStorage";
import { API_URL } from "@/lib/config";
import type { StoredUser } from "@/lib/authStorage";

export default function HomeScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "parsing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authed, setAuthed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const token = await getToken();
        const stored = await getStoredUser();
        if (!active) return;
        setAuthed(Boolean(token));
        setUser(stored);
        if (token) void ensurePushRegistered();
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <Text style={styles.navBrand}>SplitShot</Text>
        <View style={styles.navLinks}>
          {authed ? (
            <>
              <Link href="/history" style={styles.navLink}>
                History
              </Link>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await logout();
                    setAuthed(false);
                    setUser(null);
                  })();
                }}
              >
                <Text style={styles.navLink}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Link href="/login" style={styles.navLink}>
                Sign in
              </Link>
              <Link href="/register" style={styles.navBtn}>
                Register
              </Link>
            </>
          )}
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.brand}>SplitShot</Text>
        <Text style={styles.headline}>Fair splits from a receipt photo.</Text>
        <Text style={styles.lede}>
          Snap the check, let AI pull the line items, tap who ordered what, and
          share the link.
        </Text>
        {user?.email ? (
          <Text style={styles.signedIn}>Signed in as {user.email}</Text>
        ) : null}

        <UploadButton
          busy={busy}
          busyLabel={
            phase === "parsing"
              ? "Reading receipt…"
              : phase === "uploading"
                ? "Starting…"
                : "Working…"
          }
          onError={setError}
          onPicked={async (asset) => {
            setError(null);
            setBusy(true);
            setPhase("uploading");
            try {
              const session = await createSession();
              setPhase("parsing");
              await parseReceipt(session.id, {
                uri: asset.uri,
                mimeType: asset.mimeType,
                fileName: asset.fileName,
              });
              router.push(`/s/${session.id}`);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Could not parse that receipt",
              );
            } finally {
              setBusy(false);
              setPhase("idle");
            }
          }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.apiHint}>API: {API_URL}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#d5e0d8",
  },
  nav: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBrand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14231f",
  },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 12 },
  navLink: { color: "#2a4038", fontWeight: "600" },
  navBtn: {
    backgroundColor: "#14231f",
    color: "#f3f7f4",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: "600",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  brand: {
    fontSize: 48,
    fontWeight: "700",
    color: "#14231f",
    letterSpacing: -1.2,
  },
  headline: {
    fontSize: 22,
    fontWeight: "500",
    color: "#2a4038",
    maxWidth: 280,
    lineHeight: 28,
  },
  lede: {
    fontSize: 16,
    color: "#2a4038",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 12,
  },
  signedIn: { color: "#0a4f4f", fontSize: 13, marginBottom: 4 },
  error: {
    color: "#8a3b2b",
    marginTop: 8,
  },
  apiHint: {
    marginTop: 18,
    fontSize: 12,
    color: "rgba(20,35,31,0.55)",
  },
});
