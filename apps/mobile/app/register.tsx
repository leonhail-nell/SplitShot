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
import { register } from "@/lib/api";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.brand}>SplitShot</Text>
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
                await register(name.trim(), email.trim(), password);
                router.replace("/history");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Registration failed",
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#d5e0d8", justifyContent: "center" },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#f7f8f4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,35,31,0.14)",
    padding: 20,
    gap: 8,
  },
  brand: { fontSize: 28, fontWeight: "700", color: "#14231f" },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2a4038",
    marginBottom: 8,
  },
  label: { color: "#2a4038", fontSize: 13, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(20,35,31,0.14)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    color: "#14231f",
  },
  error: { color: "#8a3b2b", marginTop: 4 },
  btn: {
    marginTop: 12,
    backgroundColor: "#0d6e6e",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnLabel: { color: "#f4faf8", fontWeight: "700" },
  disabled: { opacity: 0.7 },
  link: {
    marginTop: 12,
    textAlign: "center",
    color: "#0a4f4f",
    fontWeight: "600",
  },
});
