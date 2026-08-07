import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { atmosphere, colors } from "@/lib/theme";

type AppBackgroundProps = {
  children: ReactNode;
};

/**
 * Mirrors apps/web body gradient + .site-atmosphere grid wash.
 * RN approximates radials with soft LinearGradient blobs.
 */
export function AppBackground({ children }: AppBackgroundProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...atmosphere.base]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[atmosphere.mistLeft, "transparent"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.55, y: 0.55 }}
        style={styles.mist}
      />
      <LinearGradient
        colors={[atmosphere.mistRight, "transparent"]}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.4, y: 0.5 }}
        style={styles.mist}
      />
      <View style={styles.gridWash} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mist: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  /** Soft stand-in for the masked 48px grid on web */
  gridWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 35, 31, 0.035)",
  },
  content: {
    flex: 1,
  },
});
