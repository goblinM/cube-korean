export const LEARNING_STORAGE_UNAVAILABLE_EVENT = "cubekorean:storage-unavailable";

export type LearningStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type StorageResolver = () => LearningStorage;

function notifyStorageUnavailable(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LEARNING_STORAGE_UNAVAILABLE_EVENT));
}

/**
 * 浏览器拒绝本机存储时退回当前标签页内存，保证练习可继续；刷新后内存数据会丢失。
 */
export function createResilientStorage(
  resolvePersistentStorage: StorageResolver,
  onUnavailable: () => void = notifyStorageUnavailable,
): LearningStorage {
  const memory = new Map<string, string>();
  let persistentStorage: LearningStorage | null | undefined;

  const resolve = () => {
    if (persistentStorage !== undefined) return persistentStorage;
    try {
      persistentStorage = resolvePersistentStorage();
      return persistentStorage;
    } catch {
      persistentStorage = null;
      onUnavailable();
      return null;
    }
  };

  const disablePersistentStorage = () => {
    if (persistentStorage !== null) onUnavailable();
    persistentStorage = null;
  };

  return {
    getItem(key) {
      const storage = resolve();
      if (!storage) return memory.get(key) ?? null;
      try {
        const value = storage.getItem(key);
        if (value === null) memory.delete(key);
        else memory.set(key, value);
        return value;
      } catch {
        disablePersistentStorage();
        return memory.get(key) ?? null;
      }
    },
    setItem(key, value) {
      memory.set(key, value);
      const storage = resolve();
      if (!storage) return;
      try {
        storage.setItem(key, value);
      } catch {
        disablePersistentStorage();
      }
    },
    removeItem(key) {
      memory.delete(key);
      const storage = resolve();
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        disablePersistentStorage();
      }
    },
  };
}

export const resilientBrowserStorage = createResilientStorage(() => window.localStorage);
