import NetInfo from "@react-native-community/netinfo";

let online = true;
const listeners = new Set<(value: boolean) => void>();

export function isOnline() {
  return online;
}

export function subscribeOnline(listener: (value: boolean) => void) {
  listeners.add(listener);
  listener(online);
  return () => {
    listeners.delete(listener);
  };
}

function setOnline(value: boolean) {
  if (online === value) return;
  online = value;
  for (const listener of listeners) listener(online);
}

let started = false;

export function startNetworkMonitor(onReconnect?: () => void) {
  if (started) return () => undefined;
  started = true;

  const unsub = NetInfo.addEventListener((state) => {
    const next =
      state.isConnected === true && state.isInternetReachable !== false;
    const wasOffline = !online;
    setOnline(next);
    if (wasOffline && next) {
      onReconnect?.();
    }
  });

  void NetInfo.fetch().then((state) => {
    setOnline(
      state.isConnected === true && state.isInternetReachable !== false,
    );
  });

  return () => {
    unsub();
    started = false;
  };
}
