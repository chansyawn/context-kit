import {
  DEFAULT_LOCALE,
  DEFAULT_THEME_MODE,
  LANGUAGE_OPTIONS,
  PREFERENCES_STORAGE_KEY,
  createDefaultPreferences,
  getAvailableLanguageOptions,
  isAvailableLocaleCode,
  isThemeMode,
  type Preferences,
  type LanguageOption,
  type LocaleCode,
  type ResolvedTheme,
  type TextDirection,
  type ThemeMode,
} from "@/features/preferences/preferences";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { SyncStorage, SyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";

const PREFERENCES_STORAGE_VERSION = 1;

type StoredPreferences = Preferences & {
  version: typeof PREFERENCES_STORAGE_VERSION;
};

type SystemThemeSource = {
  get: () => ResolvedTheme;
  subscribe: (callback: (theme: ResolvedTheme) => void) => () => void;
};

type CreatePreferencesAtomsOptions = {
  defaultPreferences?: Preferences;
  getStringStorage?: () => SyncStringStorage;
  systemThemeSource?: SystemThemeSource;
};

type PreferencesUpdate = Preferences | ((preferences: Preferences) => Preferences);

export type PreferencesRuntime = {
  locale: LocaleCode;
  htmlLang: string;
  direction: TextDirection;
  resolvedTheme: ResolvedTheme;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredPreferences(value: unknown): value is StoredPreferences {
  if (!isRecord(value) || Object.keys(value).length !== 3) {
    return false;
  }

  return (
    value.version === PREFERENCES_STORAGE_VERSION &&
    isAvailableLocaleCode(value.locale) &&
    isThemeMode(value.themeMode)
  );
}

function createStoredPreferences(preferences: Preferences): StoredPreferences {
  return {
    version: PREFERENCES_STORAGE_VERSION,
    locale: isAvailableLocaleCode(preferences.locale) ? preferences.locale : DEFAULT_LOCALE,
    themeMode: isThemeMode(preferences.themeMode) ? preferences.themeMode : DEFAULT_THEME_MODE,
  };
}

function toPreferences(storedPreferences: StoredPreferences) {
  return {
    locale: storedPreferences.locale,
    themeMode: storedPreferences.themeMode,
  };
}

function createPreferencesStorage(
  getStringStorage?: () => SyncStringStorage,
): SyncStorage<StoredPreferences> {
  const jsonStorage = getStringStorage
    ? createJSONStorage<unknown>(getStringStorage)
    : createJSONStorage<unknown>();

  return {
    getItem(key, initialValue) {
      const storedValue = jsonStorage.getItem(key, initialValue);

      return isStoredPreferences(storedValue) ? storedValue : initialValue;
    },
    setItem(key, value) {
      jsonStorage.setItem(key, value);
    },
    removeItem(key) {
      jsonStorage.removeItem(key);
    },
    subscribe: jsonStorage.subscribe
      ? (key, callback, initialValue) =>
          jsonStorage.subscribe?.(
            key,
            (storedValue) => {
              callback(isStoredPreferences(storedValue) ? storedValue : initialValue);
            },
            initialValue,
          )
      : undefined,
  };
}

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function createBrowserSystemThemeSource(): SystemThemeSource {
  return {
    get: readSystemTheme,
    subscribe(callback) {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {};
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateSystemTheme = () => {
        callback(mediaQuery.matches ? "dark" : "light");
      };

      updateSystemTheme();
      mediaQuery.addEventListener("change", updateSystemTheme);

      return () => {
        mediaQuery.removeEventListener("change", updateSystemTheme);
      };
    },
  };
}

export function createPreferencesAtoms({
  defaultPreferences = createDefaultPreferences(),
  getStringStorage,
  systemThemeSource = createBrowserSystemThemeSource(),
}: CreatePreferencesAtomsOptions = {}) {
  const initialStoredPreferences = createStoredPreferences(defaultPreferences);
  const storedPreferencesAtom = atomWithStorage(
    PREFERENCES_STORAGE_KEY,
    initialStoredPreferences,
    createPreferencesStorage(getStringStorage),
    { getOnInit: true },
  );

  const preferencesAtom = atom(
    (get) => toPreferences(get(storedPreferencesAtom)),
    (get, set, update: PreferencesUpdate) => {
      const currentPreferences = get(preferencesAtom);
      const nextPreferences = typeof update === "function" ? update(currentPreferences) : update;

      set(storedPreferencesAtom, createStoredPreferences(nextPreferences));
    },
  );

  const localeAtom = atom(
    (get) => get(preferencesAtom).locale,
    (get, set, locale: LocaleCode) => {
      set(preferencesAtom, {
        ...get(preferencesAtom),
        locale,
      });
    },
  );

  const themeModeAtom = atom(
    (get) => get(preferencesAtom).themeMode,
    (get, set, themeMode: ThemeMode) => {
      set(preferencesAtom, {
        ...get(preferencesAtom),
        themeMode,
      });
    },
  );

  const localeOptionsAtom = atom<LanguageOption[]>(getAvailableLanguageOptions());
  const effectiveLocaleAtom = atom((get) => {
    const locale = get(localeAtom);

    return get(localeOptionsAtom).some((option) => option.key === locale) ? locale : DEFAULT_LOCALE;
  });
  const activeLocaleAtom = atom((get) => {
    const effectiveLocale = get(effectiveLocaleAtom);

    return (
      get(localeOptionsAtom).find((option) => option.key === effectiveLocale) ??
      get(localeOptionsAtom)[0] ??
      LANGUAGE_OPTIONS[0]
    );
  });
  const textDirectionAtom = atom<TextDirection>((get) =>
    get(activeLocaleAtom).rtl ? "rtl" : "ltr",
  );

  const systemThemeAtom = atom<ResolvedTheme>(systemThemeSource.get());
  systemThemeAtom.onMount = (setSystemTheme) => systemThemeSource.subscribe(setSystemTheme);

  const resolvedThemeAtom = atom<ResolvedTheme>((get) => {
    const themeMode = get(themeModeAtom);

    return themeMode === "system" ? get(systemThemeAtom) : themeMode;
  });

  const preferencesRuntimeAtom = atom<PreferencesRuntime>((get) => {
    const activeLocale = get(activeLocaleAtom);

    return {
      locale: get(effectiveLocaleAtom),
      htmlLang: activeLocale.htmlLang,
      direction: get(textDirectionAtom),
      resolvedTheme: get(resolvedThemeAtom),
    };
  });

  return {
    preferencesAtom,
    localeAtom,
    themeModeAtom,
    localeOptionsAtom,
    effectiveLocaleAtom,
    activeLocaleAtom,
    textDirectionAtom,
    systemThemeAtom,
    resolvedThemeAtom,
    preferencesRuntimeAtom,
  };
}

export const {
  preferencesAtom,
  localeAtom,
  themeModeAtom,
  localeOptionsAtom,
  effectiveLocaleAtom,
  activeLocaleAtom,
  textDirectionAtom,
  systemThemeAtom,
  resolvedThemeAtom,
  preferencesRuntimeAtom,
} = createPreferencesAtoms();
