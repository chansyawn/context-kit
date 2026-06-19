import { createFileRoute } from "@tanstack/react-router";

async function handleGithubAuthorizeRequest({ request }: { request: Request }) {
  const { startGithubAuthorization } = await import("@/server/github/oauth.server");

  return startGithubAuthorization(request);
}

export const Route = createFileRoute("/api/github/authorize")({
  server: {
    handlers: {
      GET: handleGithubAuthorizeRequest,
    },
  },
});
