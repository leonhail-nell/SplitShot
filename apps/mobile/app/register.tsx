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
import { validateRegisterInput } from "@splitshot/shared";
import { ScreenNav } from "@/components/ScreenNav";
import { register } from "@/lib/api";
import { colors, fonts, type } from "@/lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenNav />
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
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
                  const parsed = validateRegisterInput({ name, email, password });
                  if (!parsed.ok) {
                    setError(parsed.error);
                    return;
                  }
                  await register(
                    parsed.data.name,
                    parsed.data.email,
                    parsed.data.password,
                  );
                  router.replace("/history");
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Registration failed";
                  setError(
                    /did not match the expected pattern|JSON/i.test(message)
                      ? "Registration failed"
                      : message,
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? (
              <ActivityIndicator color="#f4faf8" />
            ) : (
              <Text style={styles.btnLabel}>Register</Text>
            )}
          </Pressable>

          <Link href="/login" style={styles.link}>
            Already have an account?
          </Link>
          <Link href="/" style={styles.linkMuted}>
            Back home
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
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
