import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UploadButton } from "@/components/UploadButton";
import { createSession, ensurePushRegistered, logout, parseReceipt } from "@/lib/api";
import { getStoredUser, getToken } from "@/lib/authStorage";
import { API_URL } from "@/lib/config";
import type { StoredUser } from "@/lib/authStorage";
import { colors, fonts, type } from "@/lib/theme";

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
                Your splits
              </Link>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await logout();
                    setAuthed(false);
                    setUser(null);
                  })();
                }}
                style={styles.navBtnPress}
              >
                <Text style={styles.navBtnText}>Sign out</Text>
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
    backgroundColor: "transparent",
  },
  nav: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBrand: {
    ...type.brandNav,
  },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 14 },
  navLink: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.ink,
  },
  /** Web .nav-btn / .nav-btn-link — soft sheet pill, not solid ink */
  navBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(247, 248, 244, 0.8)",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.ink,
  },
  navBtnPress: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(247, 248, 244, 0.8)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  navBtnText: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.ink,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  brand: {
    ...type.brandHero,
    marginBottom: 12,
    textAlign: "center",
  },
  headline: {
    ...type.headline,
    maxWidth: 300,
    textAlign: "center",
  },
  lede: {
    ...type.body,
    maxWidth: 340,
    marginTop: 16,
    marginBottom: 28,
    textAlign: "center",
  },
  signedIn: {
    fontFamily: fonts.sans.regular,
    color: colors.inkSoft,
    fontSize: 13,
    opacity: 0.7,
    marginTop: -12,
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    ...type.error,
    marginTop: 12,
    textAlign: "center",
  },
  apiHint: {
    marginTop: 20,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: "rgba(20,35,31,0.4)",
    textAlign: "center",
  },
});
