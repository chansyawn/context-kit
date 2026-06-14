import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/skill-libraries")({
  component: SkillLibrariesRoute,
});

function SkillLibrariesRoute() {
  return <Outlet />;
}
