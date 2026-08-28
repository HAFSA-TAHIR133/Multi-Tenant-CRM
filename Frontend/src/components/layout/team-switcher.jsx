"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

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

function TeamDisplay({ team }) {
  const ActiveLogo = team.logo;

  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        {ActiveLogo && <ActiveLogo className="size-4" />}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{team.name}</span>
        <span className="truncate text-xs text-muted-foreground">{team.plan}</span>
      </div>
    </>
  );
}

export function TeamSwitcher({ teams = [] }) {
  const { isMobile } = useSidebar();
  const [selectedTeam, setSelectedTeam] = React.useState(null);

  const activeTeam = teams.length <= 1 ? teams[0] : selectedTeam ?? teams[0];

  React.useEffect(() => {
    if (teams.length > 1 && teams[0]) {
      setSelectedTeam(teams[0]);
    }
  }, [teams]);

  if (!activeTeam) return null;

  if (teams.length <= 1) {
    const team = teams[0];
    if (!team) return null;

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" key={team.id ?? team.name}>
            <TeamDisplay team={team} />
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
              <TeamDisplay team={activeTeam} />
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
                  onClick={() => setSelectedTeam(team)}
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
