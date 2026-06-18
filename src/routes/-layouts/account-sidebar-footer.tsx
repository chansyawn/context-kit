import { authClient } from "@/app/auth-client";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/sidebar";
import { Trans } from "@lingui/react/macro";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";

export function AccountSidebarFooter() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    await authClient.signOut();
    window.location.assign("/login");
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
