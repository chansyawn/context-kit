import { createFileRoute } from "@tanstack/react-router";

async function handleAuthRequest({ request }: { request: Request }) {
  const { auth } = await import("@/server/auth/auth.server");

  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
});
