import { AppErrorBoundary } from "@/app/app-error-boundary";
import { PreferencesProvider } from "@/features/preferences/preferences-runtime";
import { preferencesStore } from "@/features/preferences/preferences-store";
import { TooltipProvider } from "@/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { type ReactNode, useState } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={preferencesStore}>
        <PreferencesProvider>
          <AppErrorBoundary>
            <TooltipProvider>{children}</TooltipProvider>
          </AppErrorBoundary>
        </PreferencesProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
