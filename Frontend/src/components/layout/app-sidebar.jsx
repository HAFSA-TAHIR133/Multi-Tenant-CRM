"use client";

import { NavMain } from "@/components/layout/nav-main";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { useAuth } from "@/Features/auth/context/AuthContext";
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
  const { user } = useAuth();

  const role = user?.role;

  // Resolve nav items matching numeric or string role formats
  const navMain = navMainConfig[role] || [];

  // Check SuperAdmin status (handles numeric 3/1/2 or string 'SUPERADMIN'/'ADMIN')
  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN || role === 3 || role === "SUPERADMIN";

  // Derive tenant name cleanly without defaulting to "Loading..." when state exists
  const derivedTenantName =
    user?.tenantName ||
    user?.tenant?.name ||
    (isSuperAdmin ? "System Portal" : null);

  const tenantName = derivedTenantName || (user ? "CRM Portal" : "Loading...");

  const dynamicTeams = [
    {
      name: tenantName,
      logo: GalleryVerticalEnd,
      plan: isSuperAdmin ? "Super Admin Portal" : "CRM Solution",
    },
  ];

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