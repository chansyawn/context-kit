import { authClient } from "@/app/auth-client";
import { getSession } from "@/server/auth/session";
import { Button } from "@/ui/components/button";
import { Trans } from "@lingui/react/macro";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { GitBranchIcon, TagsIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await getSession();

    if (session) {
      throw redirect({ to: "/skill-libraries" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsPending(true);

    const result = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/skill-libraries",
    });

    if (result.error) {
      setError(result.error.message ?? "GitHub sign in failed.");
      setIsPending(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TagsIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">ContextKit</h1>
          <p className="text-sm text-muted-foreground">
            <Trans id="auth.login.description">Sign in to access your skill libraries.</Trans>
          </p>
        </div>
        <Button className="w-full" size="lg" disabled={isPending} onClick={handleSignIn}>
          <GitBranchIcon />
          {isPending ? (
            <Trans id="auth.login.pending">Connecting...</Trans>
          ) : (
            <Trans id="auth.login.github">Continue with GitHub</Trans>
          )}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
