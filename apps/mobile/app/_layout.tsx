import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NetworkProvider } from "@/components/NetworkProvider";

export default function RootLayout() {
  return (
    <NetworkProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="history" />
        <Stack.Screen name="s/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NetworkProvider>
  );
}
