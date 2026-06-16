import {
  preferencesRuntimeAtom,
  textDirectionAtom,
  type PreferencesRuntime,
} from "@/features/preferences/preferences-atoms";
import { DEFAULT_LOCALE, type LocaleCode } from "@/features/preferences/preferences";
import { preferencesStore, type PreferencesStore } from "@/features/preferences/preferences-store";
import { messages as enMessages } from "@/locales/en/messages.po";
import { messages as pseudoMessages } from "@/locales/pseudo/messages.po";
import { messages as zhHansMessages } from "@/locales/zh-Hans/messages.po";
import { DirectionProvider } from "@/ui/components/direction";
import { i18n, type Messages } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";

const catalogs: Record<LocaleCode, Messages> = {
  en: enMessages,
  "zh-Hans": zhHansMessages,
  pseudo: pseudoMessages,
};

for (const [locale, messages] of Object.entries(catalogs)) {
  i18n.load(locale, messages);
}
i18n.activate(DEFAULT_LOCALE);

function applyPreferencesRuntime(runtime: PreferencesRuntime) {
  i18n.activate(runtime.locale);
  document.documentElement.lang = runtime.htmlLang;
  document.documentElement.dir = runtime.direction;
  document.documentElement.classList.toggle("dark", runtime.resolvedTheme === "dark");
  document.documentElement.style.colorScheme = runtime.resolvedTheme;
}

export function initializePreferencesRuntime(
  store: PreferencesStore = preferencesStore,
): () => void {
  const applyCurrentRuntime = () => {
    applyPreferencesRuntime(store.get(preferencesRuntimeAtom));
  };

  applyCurrentRuntime();

  return store.sub(preferencesRuntimeAtom, applyCurrentRuntime);
}

type PreferencesProviderProps = {
  children: ReactNode;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const direction = useAtomValue(textDirectionAtom);

  return (
    <I18nProvider i18n={i18n}>
      <DirectionProvider direction={direction}>{children}</DirectionProvider>
    </I18nProvider>
  );
}
