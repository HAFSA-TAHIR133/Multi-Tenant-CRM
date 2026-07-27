"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {  PlusIcon } from "lucide-react";

export function TeamSwitcher({ teams }) {
  const { isMobile } = useSidebar();

  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) return null;

  const Logo = activeTeam.logo;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm">
              <span className="truncate font-medium">
                {activeTeam.name}
              </span>

              <span className="truncate text-xs">
                {activeTeam.plan}
              </span>
            </div>

          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel>
              Teams
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {teams.map((team, index) => {
                const TeamLogo = team.logo;

                return (
                  <DropdownMenuItem
                    key={team.name}
                    onClick={() => setActiveTeam(team)}
                  >
                    <div className="flex size-6 items-center justify-center rounded border">
                      <TeamLogo className="size-4" />
                    </div>

                    <span>{team.name}</span>

                    <DropdownMenuShortcut>
                      ⌘{index + 1}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <PlusIcon className="mr-2 size-4" />
              Add Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}