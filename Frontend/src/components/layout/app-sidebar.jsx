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
  AudioLines,
  Terminal,
  Users,
  GitFork,
  ListTodo,
} from "lucide-react";

const data = {
  teams: [
    {
      name: "Mercury Sols",
      logo: GalleryVerticalEnd,
      plan: "CRM Provider",
    },
    {
      name: "Acme Corp",
      logo: AudioLines,
      plan: "Startup",
    },
    {
      name: "Demo Company",
      logo: Terminal,
      plan: "Free",
    },
  ],
  navMain: {
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
  },
};

export default function AppSidebar(props) {
  const { user } = useAuth();
  const role = user?.role;
  const navMain = data.navMain[role] || [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}