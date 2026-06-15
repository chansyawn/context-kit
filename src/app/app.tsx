import { AppErrorBoundary } from "@/app/app-error-boundary";
import { PreferencesProvider } from "@/features/preferences/preferences-runtime";
import { preferencesStore } from "@/features/preferences/preferences-store";
import { SkillLibraryProvider } from "@/features/skill-libraries/skill-library-provider";
import { routeTree } from "@/routeTree.gen";
import { TooltipProvider } from "@/ui/components/tooltip";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <JotaiProvider store={preferencesStore}>
      <PreferencesProvider>
        <AppErrorBoundary>
          <TooltipProvider>
            <SkillLibraryProvider>
              <RouterProvider router={router} />
            </SkillLibraryProvider>
          </TooltipProvider>
        </AppErrorBoundary>
      </PreferencesProvider>
    </JotaiProvider>
  );
}
