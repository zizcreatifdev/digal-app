import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NotificationPanel, useNotificationCount } from "@/components/NotificationPanel";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useNotificationCount();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  const showBackButton = isPWA && pathname !== "/dashboard";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(-1)}
                  aria-label="Retour"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
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
      <OnboardingChecklist />
    </SidebarProvider>
  );
}
