import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/app-sidebar';
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        {/* flex-col ensures header sits on top and Outlet sits below */}
        <SidebarInset className="flex flex-1 flex-col min-h-screen">
          
           <header className="h-16 shrink-0 border-b">
                    
            {/* NEW INNER DIV: Forces horizontal layout no matter what the parent does */}
            <div className="flex h-full w-full flex-row items-center justify-between px-6">
                
                <SidebarTrigger className="-ml-1" />
                
                <ThemeToggle />
    
            </div>
            
            </header>

          {/* Page Content */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}