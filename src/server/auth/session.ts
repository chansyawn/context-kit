import { createServerFn } from "@tanstack/react-start";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestSession } = await import("./session.server");

  return getRequestSession();
});
