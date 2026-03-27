type SyncListener = (error: string | null) => void;

let listeners: SyncListener[] = [];
let lastError: string | null = null;

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function notifySyncError(label: string) {
  lastError = `同期に失敗しました: ${label}`;
  for (const l of listeners) l(lastError);
}

export function clearSyncError() {
  lastError = null;
  for (const l of listeners) l(null);
}

export function getLastSyncError(): string | null {
  return lastError;
}
