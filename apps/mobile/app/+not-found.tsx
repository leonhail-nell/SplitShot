import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "@/lib/theme";

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
    backgroundColor: "transparent",
    gap: 12,
  },
  brand: {
    ...type.brandAuth,
    fontSize: 36,
    textAlign: "center",
  },
  title: {
    ...type.headline,
    textAlign: "center",
  },
  link: {
    marginTop: 8,
    backgroundColor: colors.ink,
    color: colors.onInk,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
  },
});
