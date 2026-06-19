import { getSession } from "@/server/auth/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();

    throw redirect({
      to: session ? "/skill-libraries" : "/sign-in/$",
      replace: true,
    });
  },
});
