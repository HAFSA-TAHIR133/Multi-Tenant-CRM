"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
// ❌ REMOVE THIS SELF-IMPORT LINE:
// import { TeamSwitcher } from "@/components/layout/team-switcher";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({ teams = [] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  React.useEffect(() => {
    if (teams && teams.length > 0) {
      setActiveTeam(teams[0]);
    }
  }, [teams]);

  if (!activeTeam) return null;

  const ActiveLogo = activeTeam.logo;

  if (teams.length <= 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {ActiveLogo && <ActiveLogo className="size-4" />}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{activeTeam.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {activeTeam.plan}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {ActiveLogo && <ActiveLogo className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeTeam.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Tenants
            </DropdownMenuLabel>
            {teams.map((team, index) => {
              const TeamIcon = team.logo;
              return (
                <DropdownMenuItem
                  key={team.name || index}
                  onClick={() => setActiveTeam(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    {TeamIcon && <TeamIcon className="size-4 shrink-0" />}
                  </div>
                  {team.name}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}