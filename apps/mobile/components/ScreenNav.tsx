import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "@/lib/theme";

type Props = {
  /** Extra actions on the right (e.g. New split) */
  right?: ReactNode;
  /** Show an explicit Home affordance (default true) */
  showHome?: boolean;
};

/**
 * Persistent escape hatch so users can always leave a screen for home.
 */
export function ScreenNav({ right, showHome = true }: Props) {
  return (
    <View style={styles.row}>
      <Link href="/" accessibilityRole="link" accessibilityLabel="SplitShot home">
        <View style={styles.brandRow}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.brand}>SplitShot</Text>
        </View>
      </Link>
      <View style={styles.right}>
        {right}
        {showHome ? (
          <Link href="/" style={styles.homeLink} accessibilityRole="link">
            Home
          </Link>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  brand: {
    ...type.brandNav,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  homeLink: {
    color: colors.inkSoft,
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});
