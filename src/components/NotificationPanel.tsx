import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchNotifications, markNotificationRead, markAllRead, Notification, getUnreadCount } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const iconMap: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  task: Bell,
};

const colorMap: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  task: "text-primary",
};

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !open) return;
    fetchNotifications(user.id).then(setNotifications).catch(() => {});
  }, [user, open]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications(user.id).then(setNotifications).catch(() => {});
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, lu: true } : n));
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAll}>
                <Check className="h-3 w-3" /> Tout lire
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-5rem)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground font-sans">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = iconMap[notif.type] ?? Info;
              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 p-4 border-b border-border transition-colors cursor-pointer hover:bg-muted/30 ${
                    !notif.lu ? "bg-primary/5" : ""
                  }`}
                  onClick={() => !notif.lu && handleMarkRead(notif.id)}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorMap[notif.type] ?? "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-sans truncate">{notif.titre}</p>
                      {!notif.lu && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 font-sans mt-1">
                      {format(new Date(notif.created_at), "d MMM · HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setCount);

    const channel = supabase
      .channel("notif-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => { getUnreadCount(user.id).then(setCount); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
}
