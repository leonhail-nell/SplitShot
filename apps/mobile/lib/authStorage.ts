import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "splitshot_auth_token";
const USER_KEY = "splitshot_auth_user";

export type StoredUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuth(token: string, user: StoredUser) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}
