import { Button } from "@/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/components/empty";
import { Trans } from "@lingui/react/macro";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

export function AppErrorBoundary({ children }: PropsWithChildren) {
  return <ErrorBoundary FallbackComponent={AppErrorFallback}>{children}</ErrorBoundary>;
}

function AppErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Empty role="alert" className="max-w-xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <AlertTriangleIcon />
          </EmptyMedia>
          <EmptyTitle>
            <Trans id="app.error.title">Something went wrong</Trans>
          </EmptyTitle>
          <EmptyDescription>
            <Trans id="app.error.description">
              An unexpected error interrupted the application. Try loading it again.
            </Trans>
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={resetErrorBoundary}>
            <RefreshCwIcon data-icon="inline-start" />
            <Trans id="common.tryAgain">Try again</Trans>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
