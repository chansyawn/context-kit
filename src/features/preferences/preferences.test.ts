import {
  createDefaultPreferences,
  isAvailableLocaleCode,
  isLocaleCode,
  isThemeMode,
  readPreferredLocale,
} from "@/features/preferences/preferences";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

function setNavigatorLanguages(languages: string[]): void {
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: languages,
  });
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: languages[0] ?? "",
  });
}

describe("preferences", () => {
  beforeEach(() => {
    setNavigatorLanguages(["en-US"]);
  });

  afterEach(() => {
    setNavigatorLanguages(["en-US"]);
  });

  it("uses the browser locale and system theme as defaults", () => {
    setNavigatorLanguages(["fr-FR", "zh-CN"]);

    expect(readPreferredLocale()).toBe("zh-Hans");
    expect(createDefaultPreferences()).toEqual({
      locale: "zh-Hans",
      themeMode: "system",
    });
  });

  it("falls back to English when the browser locales are unsupported", () => {
    setNavigatorLanguages(["fr-FR", "de-DE"]);

    expect(readPreferredLocale()).toBe("en");
  });

  it("accepts only exact locale and theme mode values", () => {
    expect(isLocaleCode("zh-Hans")).toBe(true);
    expect(isLocaleCode("zh-CN")).toBe(false);
    expect(isLocaleCode("fr")).toBe(false);
    expect(isAvailableLocaleCode("zh-Hans")).toBe(true);
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("sepia")).toBe(false);
  });
});
