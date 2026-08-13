import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import NavUser from "@/components/layout/nav-user";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex flex-1 flex-col min-h-screen">
          <header className="h-16 shrink-0 border-b">
            <div className="flex h-full w-full flex-row items-center justify-between px-6">
              <SidebarTrigger className="-ml-1" />

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <NavUser />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}