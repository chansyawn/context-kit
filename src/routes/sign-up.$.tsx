import { getSession } from "@/server/auth/session";
import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { TagsIcon } from "lucide-react";

export const Route = createFileRoute("/sign-up/$")({
  beforeLoad: async () => {
    const session = await getSession();

    if (session) {
      throw redirect({ to: "/skill-libraries" });
    }
  },
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TagsIcon className="size-6" />
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/skill-libraries"
        />
      </div>
    </main>
  );
}
