import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Shield, User, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  usePageTitle("Digal · Administration");
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="text-muted-foreground relative" onClick={() => setNotifOpen(true)}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate("/admin/profil")}>
                <User className="h-4 w-4" />
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
