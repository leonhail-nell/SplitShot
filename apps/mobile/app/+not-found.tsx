import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.brand}>SplitShot</Text>
        <Text style={styles.title}>That split link was not found.</Text>
        <Link href="/" style={styles.link}>
          Start a new split
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#d5e0d8",
    gap: 12,
  },
  brand: {
    fontSize: 36,
    fontWeight: "700",
    color: "#14231f",
  },
  title: {
    fontSize: 18,
    color: "#2a4038",
    textAlign: "center",
  },
  link: {
    marginTop: 8,
    backgroundColor: "#14231f",
    color: "#f3f7f4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "600",
  },
});
