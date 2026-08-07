import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { startNetworkMonitor, subscribeOnline } from "@/lib/network";
import { flushQueue } from "@/lib/offline/queue";

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const stop = startNetworkMonitor(() => {
      void flushQueue();
    });
    const unsub = subscribeOnline(setOnline);
    return () => {
      stop();
      unsub();
    };
  }, []);

  return (
    <View style={styles.root}>
      {!online ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Offline — edits will sync later</Text>
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  banner: {
    backgroundColor: "#8a3b2b",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerText: {
    color: "#fff7f4",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
});
