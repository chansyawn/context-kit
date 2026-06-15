"use client";

import {
  activeLocaleAtom,
  localeAtom,
  localeOptionsAtom,
  resolvedThemeAtom,
  themeModeAtom,
} from "@/features/preferences/preferences-atoms";
import type { LocaleCode, ThemeMode } from "@/features/preferences/preferences";
import { THEME_MODE_OPTIONS } from "@/features/preferences/preferences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/sidebar";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { LanguagesIcon, MoonIcon, SunIcon } from "lucide-react";

export function SidebarSettings() {
  const { i18n } = useLingui();
  const activeLocale = useAtomValue(activeLocaleAtom);
  const localeOptions = useAtomValue(localeOptionsAtom);
  const resolvedTheme = useAtomValue(resolvedThemeAtom);
  const themeMode = useAtomValue(themeModeAtom);
  const setLocale = useSetAtom(localeAtom);
  const setThemeMode = useSetAtom(themeModeAtom);
  const languageLabel = i18n._({
    id: "settings.language.title",
    message: "Language",
  });
  const themeLabel = i18n._({
    id: "settings.theme.title",
    message: "Theme",
  });

  return (
    <SidebarMenu className="flex-row gap-1">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="size-8! justify-center"
                aria-label={languageLabel}
                title={languageLabel}
              />
            }
          >
            <LanguagesIcon />
            <span className="sr-only">{languageLabel}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-40">
            <DropdownMenuRadioGroup
              value={activeLocale.key}
              onValueChange={(value) => {
                setLocale(value as LocaleCode);
              }}
            >
              {localeOptions.map((option) => (
                <DropdownMenuRadioItem key={option.key} value={option.key}>
                  {option.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="size-8! justify-center"
                aria-label={themeLabel}
                title={themeLabel}
              />
            }
          >
            {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
            <span className="sr-only">{themeLabel}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={themeMode}
              onValueChange={(value) => {
                setThemeMode(value as ThemeMode);
              }}
            >
              {THEME_MODE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {i18n._(themeModeLabel(option))}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function themeModeLabel(themeMode: ThemeMode): MessageDescriptor {
  switch (themeMode) {
    case "dark":
      return msg({ id: "settings.theme.dark", message: "Dark" });
    case "light":
      return msg({ id: "settings.theme.light", message: "Light" });
    case "system":
      return msg({ id: "settings.theme.system", message: "System" });
  }
}
