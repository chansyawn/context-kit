import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/sidebar";
import { useClerk } from "@clerk/tanstack-react-start";
import { Trans } from "@lingui/react/macro";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";

export function AccountSidebarFooter() {
  const { signOut } = useClerk();
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    await signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton disabled={isPending} onClick={handleSignOut}>
          <LogOutIcon />
          <Trans id="auth.logout">Sign out</Trans>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
