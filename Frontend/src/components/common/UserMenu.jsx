import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

export default function UserMenu({
  user,
  onLogout,
  onEdit,
  onDelete,
  showEdit = false,
  showDelete = false,
}) {
  const { isMobile } = useSidebar();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="aria-expanded:bg-muted">
              <Avatar>
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>

              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {(showEdit || showDelete) && (
              <>
                <DropdownMenuGroup>
                  {showEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                  )}

                  {showDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}