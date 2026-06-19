import { getSession } from "@/server/auth/session";
import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { TagsIcon } from "lucide-react";

export const Route = createFileRoute("/sign-in/$")({
  beforeLoad: async () => {
    const session = await getSession();

    if (session) {
      throw redirect({ to: "/skill-libraries" });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TagsIcon className="size-6" />
        </div>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/skill-libraries"
        />
      </div>
    </main>
  );
}
