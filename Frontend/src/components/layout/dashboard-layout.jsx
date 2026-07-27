import { Outlet } from "react-router-dom";
import AppSidebar from "./app-sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Keep header simple, no flex/grid classes here that could be overridden */}
        <header className="h-16 shrink-0 border-b">
          
          {/* NEW INNER DIV: Forces horizontal layout no matter what the parent does */}
          <div className="flex h-full w-full flex-row items-center justify-between px-6">
            
            <SidebarTrigger className="-ml-1" />
            
            <ThemeToggle />

          </div>
          
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}