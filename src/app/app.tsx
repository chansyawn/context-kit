import { AppErrorBoundary } from "@/app/app-error-boundary";
import { DirectionStateProvider } from "@/app/direction";
import { I18nStateProvider } from "@/app/i18n";
import { ThemeStateProvider } from "@/app/theme";
import { SkillLibraryProvider } from "@/features/skill-libraries/skill-library-provider";
import { routeTree } from "@/routeTree.gen";
import { TooltipProvider } from "@/ui/components/tooltip";
import { createRouter, RouterProvider } from "@tanstack/react-router";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <ThemeStateProvider>
      <I18nStateProvider>
        <DirectionStateProvider>
          <AppErrorBoundary>
            <TooltipProvider>
              <SkillLibraryProvider>
                <RouterProvider router={router} />
              </SkillLibraryProvider>
            </TooltipProvider>
          </AppErrorBoundary>
        </DirectionStateProvider>
      </I18nStateProvider>
    </ThemeStateProvider>
  );
}
