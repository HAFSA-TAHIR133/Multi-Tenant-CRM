"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { useAuth } from "@/Features/auth/context/AuthContext";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";

export function AppSidebar({ ...props }) {
  const { user } = useAuth();
  console.log(user);

  // 1. Resolve dynamic tenant name from user auth context
  const tenantName =
    user?.tenantName ||
    user?.tenant?.name ||
    (user?.role === "SUPERADMIN" || user?.role === 3
      ? "System Portal"
      : "Loading...");

  // 2. Build the teams array dynamically (NO "Acme Inc" fallback)
  const teams = React.useMemo(() => {
    return [
      {
        name: tenantName,
        logo: GalleryVerticalEnd,
        plan:
          user?.role === "SUPERADMIN" || user?.role === 3
            ? "Super Admin Portal"
            : "CRM Solution",
      },
    ];
  }, [tenantName, user?.role]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Pass dynamically derived teams */}
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* Rest of your sidebar navigation */}
      </SidebarContent>
    </Sidebar>
  );
}