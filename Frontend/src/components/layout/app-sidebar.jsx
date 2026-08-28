"use client";

import { useMemo } from "react";
import { NavMain } from "@/components/layout/nav-main";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { useAuth } from "@/Features/auth/context/AuthContext";
import {
  getAuthSession,
  resolveTenantDisplayName,
} from "@/Features/auth/utils/tenantDisplay";
import { ROLES } from "@/constants/roles";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Building2,
  GalleryVerticalEnd,
  Users,
  GitFork,
  ListTodo,
} from "lucide-react";

const navMainConfig = {
  [ROLES.SUPER_ADMIN]: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Building2,
    },
  ],

  [ROLES.ADMIN]: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Leads",
      url: "/admin/leads",
      icon: Users,
    },
    {
      title: "Pipelines",
      url: "/admin/pipelines",
      icon: GitFork,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Tasks",
      url: "/admin/tasks",
      icon: ListTodo,
    },
  ],

  [ROLES.USER]: [
    {
      title: "Dashboard",
      url: "/user/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Leads",
      url: "/user/leads",
      icon: Users,
    },
    {
      title: "Tasks",
      url: "/user/tasks",
      icon: ListTodo,
    },
  ],
};

export default function AppSidebar(props) {
  const { user, activeTenant, accessToken } = useAuth();

  const role = user?.role;

  const navMain = navMainConfig[role] || [];

  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN || role === 3 || role === "SUPERADMIN";

  const tenantName = useMemo(() => {
    const fromContext = resolveTenantDisplayName({
      user,
      activeTenant,
      accessToken,
    });
    if (fromContext) return fromContext;

    const fromStorage = getAuthSession()?.tenantDisplayName;
    if (fromStorage) return fromStorage;

    return user ? "Loading..." : "Loading...";
  }, [user, activeTenant, accessToken]);

  const dynamicTeams = useMemo(
    () => [
      {
        name: tenantName,
        logo: GalleryVerticalEnd,
        plan: isSuperAdmin ? "Super Admin Portal" : "CRM Solution",
      },
    ],
    [tenantName, isSuperAdmin]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={dynamicTeams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
