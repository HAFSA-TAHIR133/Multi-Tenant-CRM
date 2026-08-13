import { Outlet } from "react-router-dom";
import AppSidebar from "./app-sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NavUser from "@/components/layout/nav-user"; 
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
        <header className="h-16 shrink-0 border-b">
          <div className="flex h-full w-full flex-row items-center justify-between px-6">
            <SidebarTrigger className="-ml-1" />
            
            {/* Header Right Controls */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <NavUser /> 
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}