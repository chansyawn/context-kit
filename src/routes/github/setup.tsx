import { getSession } from "@/server/auth/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/github/setup")({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    throw redirect({ to: "/skill-libraries" });
  },
});
