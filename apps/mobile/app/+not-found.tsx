import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenNav } from "@/components/ScreenNav";
import { colors, fonts, type } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <ScreenNav />
      <View style={styles.container}>
        <Text style={styles.title}>That split link was not found.</Text>
        <Link href="/" style={styles.link}>
          Start a new split
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
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
