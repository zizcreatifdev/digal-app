import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { NotificationPanel, useNotificationCount } from "@/components/NotificationPanel";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useNotificationCount();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {pageTitle && (
                <h2 className="text-lg font-bold font-serif">{pageTitle}</h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground relative"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </SidebarProvider>
  );
}
