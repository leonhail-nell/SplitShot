import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadows, type } from "@/lib/theme";

type Props = {
  busy: boolean;
  busyLabel?: string;
  onPicked: (asset: ImagePicker.ImagePickerAsset) => void;
  onError: (message: string) => void;
};

export function UploadButton({ busy, busyLabel, onPicked, onError }: Props) {
  async function pick(fromCamera: boolean) {
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          onError("Camera permission is required to photograph a receipt.");
          return;
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          onError("Photo library permission is required.");
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          });

      if (result.canceled || !result.assets[0]) return;
      onPicked(result.assets[0]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not open the camera");
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.primaryPress, busy && styles.disabled]}
        disabled={busy}
        onPress={() => void pick(true)}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentDeep]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.primary}
        >
          {busy ? (
            <ActivityIndicator color="#f4faf8" />
          ) : (
            <Text style={styles.primaryLabel}>Take receipt photo</Text>
          )}
          <Text style={styles.hint}>
            {busy ? busyLabel ?? "Working…" : "Uses your camera"}
          </Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={[styles.secondary, busy && styles.disabled]}
        disabled={busy}
        onPress={() => void pick(false)}
      >
        <Text style={styles.secondaryLabel}>Choose from library</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 352,
    gap: 14,
    alignItems: "center",
  },
  primaryPress: {
    width: "100%",
    borderRadius: 18,
    ...shadows.cta,
  },
  primary: {
    width: "100%",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  primaryLabel: {
    ...type.ctaLabel,
  },
  hint: {
    marginTop: 4,
    ...type.ctaHint,
  },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(247,248,244,0.8)",
  },
  secondaryLabel: {
    ...type.button,
  },
  disabled: {
    opacity: 0.88,
  },
});
