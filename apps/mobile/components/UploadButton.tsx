import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
        style={[styles.primary, busy && styles.disabled]}
        disabled={busy}
        onPress={() => void pick(true)}
      >
        {busy ? (
          <ActivityIndicator color="#f4faf8" />
        ) : (
          <Text style={styles.primaryLabel}>Take receipt photo</Text>
        )}
        <Text style={styles.hint}>
          {busy ? busyLabel ?? "Working…" : "Uses your camera"}
        </Text>
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
    gap: 12,
    alignItems: "center",
  },
  primary: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#0d6e6e",
    alignItems: "center",
    shadowColor: "#14231f",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryLabel: {
    color: "#f4faf8",
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    marginTop: 4,
    color: "rgba(244,250,248,0.82)",
    fontSize: 13,
  },
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(20,35,31,0.16)",
    backgroundColor: "rgba(247,248,244,0.72)",
  },
  secondaryLabel: {
    color: "#14231f",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.7,
  },
});
