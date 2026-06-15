export const PREFERENCES_STORAGE_KEY = "tagskills.appearance";

export const LOCALE_CODES = ["en", "zh-Hans", "pseudo"] as const;
export const THEME_MODE_OPTIONS = ["system", "light", "dark"] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];
export type ThemeMode = (typeof THEME_MODE_OPTIONS)[number];
export type ResolvedTheme = "light" | "dark";
export type TextDirection = "ltr" | "rtl";

export type LanguageOption = {
  key: LocaleCode;
  name: string;
  rtl: boolean;
  htmlLang: string;
  devOnly?: boolean;
};

export type Preferences = {
  locale: LocaleCode;
  themeMode: ThemeMode;
};

export const LANGUAGE_OPTIONS = [
  { key: "en", name: "English", rtl: false, htmlLang: "en" },
  { key: "zh-Hans", name: "简体中文", rtl: false, htmlLang: "zh-Hans" },
  { key: "pseudo", name: "Pseudo RTL", rtl: true, htmlLang: "en-XA", devOnly: true },
] as const satisfies readonly LanguageOption[];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const DEFAULT_THEME_MODE: ThemeMode = "system";

const IS_DEV = import.meta.env.DEV;

function readBrowserLocaleCandidates(): string[] {
  if (typeof navigator === "undefined") {
    return [];
  }

  return [...navigator.languages, navigator.language].filter((locale) => locale.length > 0);
}

function resolveLocaleCandidate(input: string): LocaleCode | null {
  if (input.startsWith("zh")) {
    return "zh-Hans";
  }

  if (input.startsWith("en")) {
    return "en";
  }

  return null;
}

export function isLocaleCode(input: unknown): input is LocaleCode {
  return typeof input === "string" && LOCALE_CODES.some((locale) => locale === input);
}

export function isThemeMode(input: unknown): input is ThemeMode {
  return typeof input === "string" && THEME_MODE_OPTIONS.some((themeMode) => themeMode === input);
}

export function isAvailableLocaleCode(input: unknown): input is LocaleCode {
  return (
    isLocaleCode(input) && getAvailableLanguageOptions().some((option) => option.key === input)
  );
}

export function readPreferredLocale(): LocaleCode {
  for (const locale of readBrowserLocaleCandidates()) {
    const resolvedLocale = resolveLocaleCandidate(locale);

    if (resolvedLocale) {
      return resolvedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

export function createDefaultPreferences(): Preferences {
  return {
    locale: readPreferredLocale(),
    themeMode: DEFAULT_THEME_MODE,
  };
}

export function getAvailableLanguageOptions(): LanguageOption[] {
  return LANGUAGE_OPTIONS.filter(
    (option) => IS_DEV || !("devOnly" in option) || option.devOnly !== true,
  );
}
