import Constants from "expo-constants";
import { Platform } from "react-native";

function defaultHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host && host !== "127.0.0.1" && host !== "localhost") {
    return host;
  }
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }
  return "localhost";
}

const host = defaultHost();

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:3000`;

export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? `http://${host}:3000`;
