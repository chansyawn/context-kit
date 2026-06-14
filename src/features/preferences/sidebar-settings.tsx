"use client";

import { useI18nState } from "@/app/i18n";
import type { LocaleCode, ThemeMode } from "@/app/preferences";
import { THEME_MODE_OPTIONS } from "@/app/preferences";
import { useThemeState } from "@/app/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/sidebar";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { LanguagesIcon, MoonIcon, SunIcon } from "lucide-react";

export function SidebarSettings() {
  const { i18n } = useLingui();
  const { activeLocale, localeOptions, setLocale } = useI18nState();
  const { resolvedTheme, setThemeMode, themeMode } = useThemeState();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            <LanguagesIcon />
            <span>
              <Trans id="settings.language.title">Language</Trans>
            </span>
            <span className="ms-auto text-xs text-muted-foreground">{activeLocale.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Trans id="settings.language.title">Language</Trans>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
            <span>
              <Trans id="settings.theme.title">Theme</Trans>
            </span>
            <span className="ms-auto text-xs text-muted-foreground">
              {i18n._(themeModeLabel(themeMode))}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Trans id="settings.theme.title">Theme</Trans>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
