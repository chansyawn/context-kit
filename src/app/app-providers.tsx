import { AppErrorBoundary } from "@/app/app-error-boundary";
import { PreferencesProvider } from "@/features/preferences/preferences-runtime";
import { preferencesStore } from "@/features/preferences/preferences-store";
import { SkillLibraryProvider } from "@/features/skill-libraries/skill-library-provider";
import { TooltipProvider } from "@/ui/components/tooltip";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <JotaiProvider store={preferencesStore}>
      <PreferencesProvider>
        <AppErrorBoundary>
          <TooltipProvider>
            <SkillLibraryProvider>{children}</SkillLibraryProvider>
          </TooltipProvider>
        </AppErrorBoundary>
      </PreferencesProvider>
    </JotaiProvider>
  );
}
