import { useSyncExternalStore } from 'react';

type AvatarResource = 'companies' | 'users';

type AvatarMap = Record<string, string>;

type AvatarStoreState = {
  companies: AvatarMap;
  users: AvatarMap;
};

const STORAGE_KEY = 'crm.customAvatars';

const listeners = new Set<() => void>();

const createEmptyState = (): AvatarStoreState => ({
  companies: {},
  users: {},
});

let state: AvatarStoreState = createEmptyState();

const safeWindow = typeof window !== 'undefined' ? window : undefined;

const persistState = () => {
  if (!safeWindow) return;

  try {
    safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to persist custom avatar store', error);
    }
  }
};

const hydrateState = () => {
  if (!safeWindow) return;

  try {
    const raw = safeWindow.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as AvatarStoreState | null;

    if (parsed && typeof parsed === 'object') {
      state = {
        companies: parsed.companies ?? {},
        users: parsed.users ?? {},
      } satisfies AvatarStoreState;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to hydrate custom avatar store', error);
    }
  }
};

if (safeWindow) {
  hydrateState();
}

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setAvatarInternal = (resource: AvatarResource, id: string, value: string | null) => {
  const current = state[resource];
  const next: AvatarMap = value
    ? { ...current, [id]: value }
    : (() => {
        if (!(id in current)) return current;
        const rest = { ...current };
        delete rest[id];
        return rest;
      })();

  state = {
    ...state,
    [resource]: next,
  } satisfies AvatarStoreState;

  persistState();
  emitChange();
};

const getAvatarKey = (id: string | number | undefined) => {
  if (id === undefined || id === null) {
    return undefined;
  }

  return String(id);
};

export const customAvatarStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getAvatar: (resource: AvatarResource, id: string | number | undefined) => {
    const key = getAvatarKey(id);
    if (!key) return undefined;
    return state[resource][key];
  },
  setAvatar: (resource: AvatarResource, id: string | number, value: string) => {
    const key = getAvatarKey(id);
    if (!key) return;
    setAvatarInternal(resource, key, value);
  },
  clearAvatar: (resource: AvatarResource, id: string | number) => {
    const key = getAvatarKey(id);
    if (!key) return;
    setAvatarInternal(resource, key, null);
  },
};

export const useCustomAvatar = (
  resource?: AvatarResource,
  id?: string | number,
): string | undefined => {
  const snapshot = useSyncExternalStore(
    customAvatarStore.subscribe,
    customAvatarStore.getState,
    customAvatarStore.getState,
  );

  if (!resource) {
    return undefined;
  }

  const key = getAvatarKey(id);
  if (!key) {
    return undefined;
  }

  return snapshot[resource][key];
};

export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unsupported file reader result'));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export type { AvatarResource };
