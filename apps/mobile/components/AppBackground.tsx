import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { atmosphere, colors } from "@/lib/theme";

type AppBackgroundProps = {
  children: ReactNode;
};

const GRID = 48;
const GRID_LINE = "rgba(20, 35, 31, 0.04)";

/**
 * Mirrors apps/web body background + .site-atmosphere:
 *   radial mist at 10%/-10% and 90%/0% (corner blobs, not a center spotlight),
 *   linear wash 160deg #e7efe8 → #d5e0d8 → #c7d4cd,
 *   48px ink grid (web also masks to center; RN shows the full subtle grid).
 */
export function AppBackground({ children }: AppBackgroundProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...atmosphere.base]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top-left mist — web: radial(1200px 600px at 10% -10%) */}
      <LinearGradient
        colors={[
          atmosphere.mistLeft,
          "rgba(201, 221, 212, 0.4)",
          "transparent",
        ]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.mistBlob,
          {
            width: width * 1.55,
            height: height * 0.58,
            left: -width * 0.28,
            top: -height * 0.12,
          },
        ]}
        pointerEvents="none"
      />

      {/* Top-right mist — web: radial(900px 500px at 90% 0%) */}
      <LinearGradient
        colors={[
          atmosphere.mistRight,
          "rgba(183, 207, 200, 0.36)",
          "transparent",
        ]}
        locations={[0, 0.38, 1]}
        start={{ x: 0.88, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.mistBlob,
          {
            width: width * 1.25,
            height: height * 0.5,
            right: -width * 0.22,
            top: -height * 0.04,
          },
        ]}
        pointerEvents="none"
      />

      <AtmosphereGrid width={width} height={height} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/** Soft stand-in for .site-atmosphere 48px grid */
function AtmosphereGrid({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const lines = useMemo(() => {
    const cols = Math.ceil(width / GRID) + 1;
    const rows = Math.ceil(height / GRID) + 1;
    const nodes: ReactNode[] = [];

    for (let i = 0; i <= cols; i++) {
      nodes.push(
        <View
          key={`v-${i}`}
          style={{
            position: "absolute",
            left: i * GRID,
            top: 0,
            width: StyleSheet.hairlineWidth,
            height,
            backgroundColor: GRID_LINE,
          }}
        />,
      );
    }
    for (let j = 0; j <= rows; j++) {
      nodes.push(
        <View
          key={`h-${j}`}
          style={{
            position: "absolute",
            top: j * GRID,
            left: 0,
            height: StyleSheet.hairlineWidth,
            width,
            backgroundColor: GRID_LINE,
          }}
        />,
      );
    }
    return nodes;
  }, [width, height]);

  return (
    <View style={styles.gridRoot} pointerEvents="none">
      {lines}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mistBlob: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.9,
  },
  gridRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
