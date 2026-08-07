import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { login } from "@/lib/api";
import { colors, fonts, type } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.brand}>SplitShot</Text>
        <Text style={styles.title}>Sign in</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => {
            void (async () => {
              setBusy(true);
              setError(null);
              try {
                await login(email.trim(), password);
                router.replace("/history");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Sign in failed");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? (
            <ActivityIndicator color="#f4faf8" />
          ) : (
            <Text style={styles.btnLabel}>Sign in</Text>
          )}
        </Pressable>

        <Link href="/register" style={styles.link}>
          Create an account
        </Link>
        <Link href="/" style={styles.linkMuted}>
          Back home
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.sheet,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 8,
  },
  brand: {
    ...type.brandAuth,
    textAlign: "center",
  },
  title: {
    ...type.title,
    fontSize: 22,
    color: colors.inkSoft,
    marginBottom: 8,
    textAlign: "center",
  },
  label: { ...type.label, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    ...type.input,
  },
  error: { ...type.error, marginTop: 4, textAlign: "center" },
  btn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnLabel: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    color: colors.onAccent,
  },
  disabled: { opacity: 0.7 },
  link: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.accentDeep,
  },
  linkMuted: {
    textAlign: "center",
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.inkSoft,
    opacity: 0.7,
    marginTop: 4,
  },
});
