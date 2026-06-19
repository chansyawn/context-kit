import { createFileRoute } from "@tanstack/react-router";

async function handleGithubCallbackRequest({ request }: { request: Request }) {
  const { completeGithubAuthorization } = await import("@/server/github/oauth.server");

  return completeGithubAuthorization(request);
}

export const Route = createFileRoute("/api/github/callback")({
  server: {
    handlers: {
      GET: handleGithubCallbackRequest,
    },
  },
});
