import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/authStorage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function authHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registerForPushNotifications() {
  const token = await getToken();
  if (!token) return null;

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const push = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  await fetch(`${API_URL}/api/mobile/devices`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      token: push.data,
      platform:
        Platform.OS === "ios"
          ? "ios"
          : Platform.OS === "android"
            ? "android"
            : "unknown",
    }),
  });

  return push.data;
}

export async function unregisterPushNotifications(expoToken?: string | null) {
  const auth = await getToken();
  if (!auth || !expoToken) return;
  await fetch(`${API_URL}/api/mobile/devices`, {
    method: "DELETE",
    headers: await authHeaders(),
    body: JSON.stringify({ token: expoToken }),
  }).catch(() => undefined);
}
