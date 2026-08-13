import { Link, useLocation } from "react-router-dom";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function NavMain({ items = [] }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            location.pathname === item.url ||
            (item.url !== "/" && location.pathname.startsWith(`${item.url}/`));

          const ItemIcon = item.icon;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={isActive ? "bg-slate-700 dark:bg-slate-400 font-medium" : ""}
              >
                <Link to={item.url} className="flex items-center gap-3 w-full">
                  {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" />}
                  <span className="text-sm truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}