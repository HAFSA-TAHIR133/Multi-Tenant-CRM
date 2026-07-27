import { useAuth } from "@/Features/auth/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
} from "lucide-react";

export default function NavUser() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-10 items-center gap-2 px-2 pb-4">
          <Avatar className="h-8 w-8">
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
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">

        <DropdownMenuItem onClick={logout}>
          <LogOutIcon className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}