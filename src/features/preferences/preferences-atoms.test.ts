import { createPreferencesAtoms } from "@/features/preferences/preferences-atoms";
import type { Preferences, ResolvedTheme } from "@/features/preferences/preferences";
import { PREFERENCES_STORAGE_KEY } from "@/features/preferences/preferences";
import { createStore } from "jotai";
import type { SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { describe, expect, it } from "vite-plus/test";

const DEFAULT_PREFERENCES: Preferences = {
  locale: "en",
  themeMode: "system",
};

function createMemoryStorage(initialValue?: unknown) {
  const values = new Map<string, string>();
  const listeners = new Map<string, Set<(value: string | null) => void>>();

  if (initialValue !== undefined) {
    values.set(PREFERENCES_STORAGE_KEY, JSON.stringify(initialValue));
  }

  const storage: SyncStringStorage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
      listeners.get(key)?.forEach((listener) => listener(value));
    },
    removeItem(key) {
      values.delete(key);
      listeners.get(key)?.forEach((listener) => listener(null));
    },
    subscribe(key, callback) {
      const keyListeners = listeners.get(key) ?? new Set();

      keyListeners.add(callback);
      listeners.set(key, keyListeners);

      return () => {
        keyListeners.delete(callback);
      };
    },
  };

  return {
    storage,
    read() {
      return JSON.parse(values.get(PREFERENCES_STORAGE_KEY) ?? "null") as unknown;
    },
  };
}

function createSystemThemeSource(initialTheme: ResolvedTheme = "light") {
  let theme = initialTheme;
  const listeners = new Set<(nextTheme: ResolvedTheme) => void>();

  return {
    source: {
      get: () => theme,
      subscribe(callback: (nextTheme: ResolvedTheme) => void) {
        listeners.add(callback);

        return () => {
          listeners.delete(callback);
        };
      },
    },
    set(nextTheme: ResolvedTheme) {
      theme = nextTheme;
      listeners.forEach((listener) => listener(nextTheme));
    },
  };
}

function createTestAtoms(initialValue?: unknown) {
  const memory = createMemoryStorage(initialValue);
  const systemTheme = createSystemThemeSource();
  const atoms = createPreferencesAtoms({
    defaultPreferences: DEFAULT_PREFERENCES,
    getStringStorage: () => memory.storage,
    systemThemeSource: systemTheme.source,
  });

  return { atoms, memory, systemTheme };
}

describe("preferences atoms", () => {
  it("uses default preferences when storage is empty", () => {
    const { atoms } = createTestAtoms();
    const store = createStore();

    expect(store.get(atoms.preferencesAtom)).toEqual(DEFAULT_PREFERENCES);
  });

  it.each([
    { locale: "zh-Hans", themeMode: "dark" },
    { version: 2, locale: "zh-Hans", themeMode: "dark" },
    { version: 1, locale: "zh-CN", themeMode: "dark" },
    { version: 1, locale: "zh-Hans" },
    { version: 1, locale: "zh-Hans", themeMode: "dark", extra: true },
  ])("rejects an invalid complete stored record", (storedValue) => {
    const { atoms } = createTestAtoms(storedValue);
    const store = createStore();

    expect(store.get(atoms.preferencesAtom)).toEqual(DEFAULT_PREFERENCES);
  });

  it("reads a valid stored record", () => {
    const { atoms } = createTestAtoms({
      version: 1,
      locale: "zh-Hans",
      themeMode: "dark",
    });
    const store = createStore();

    expect(store.get(atoms.preferencesAtom)).toEqual({
      locale: "zh-Hans",
      themeMode: "dark",
    });
  });

  it("updates one preference and writes a complete versioned record", () => {
    const { atoms, memory } = createTestAtoms();
    const store = createStore();

    store.set(atoms.localeAtom, "zh-Hans");

    expect(store.get(atoms.preferencesAtom)).toEqual({
      locale: "zh-Hans",
      themeMode: "system",
    });
    expect(memory.read()).toEqual({
      version: 1,
      locale: "zh-Hans",
      themeMode: "system",
    });
  });

  it("derives and subscribes to the system theme", () => {
    const { atoms, systemTheme } = createTestAtoms();
    const store = createStore();
    const unsubscribe = store.sub(atoms.resolvedThemeAtom, () => {});

    expect(store.get(atoms.resolvedThemeAtom)).toBe("light");

    systemTheme.set("dark");
    expect(store.get(atoms.resolvedThemeAtom)).toBe("dark");

    store.set(atoms.themeModeAtom, "light");
    systemTheme.set("dark");
    expect(store.get(atoms.resolvedThemeAtom)).toBe("light");

    unsubscribe();
  });

  it("synchronizes external storage updates between stores", () => {
    const memory = createMemoryStorage();
    const firstAtoms = createPreferencesAtoms({
      defaultPreferences: DEFAULT_PREFERENCES,
      getStringStorage: () => memory.storage,
    });
    const secondAtoms = createPreferencesAtoms({
      defaultPreferences: DEFAULT_PREFERENCES,
      getStringStorage: () => memory.storage,
    });
    const firstStore = createStore();
    const secondStore = createStore();
    const unsubscribeFirst = firstStore.sub(firstAtoms.preferencesAtom, () => {});
    const unsubscribeSecond = secondStore.sub(secondAtoms.preferencesAtom, () => {});

    firstStore.set(firstAtoms.themeModeAtom, "dark");

    expect(secondStore.get(secondAtoms.themeModeAtom)).toBe("dark");

    unsubscribeFirst();
    unsubscribeSecond();
  });
});
