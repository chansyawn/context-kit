import { AppLayout } from "@/routes/-layouts/app-layout";
import { getSession } from "@/server/auth/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/skill-libraries")({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});
