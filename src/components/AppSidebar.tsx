import {
  LayoutDashboard, Users, Calendar, Receipt, BookOpen, BarChart3,
  Activity, Settings, LogOut, Lock, Crown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import digalLogo from "@/assets/digal-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, locked: false },
  { title: "Clients", url: "/dashboard/clients", icon: Users, locked: false },
  { title: "Calendrier", url: "/dashboard/calendrier", icon: Calendar, locked: false },
  { title: "Facturation", url: "/dashboard/facturation", icon: Receipt, locked: true },
  { title: "Comptabilité", url: "/dashboard/comptabilite", icon: BookOpen, locked: true },
  { title: "Rapports KPI", url: "/dashboard/rapports", icon: BarChart3, locked: true },
  { title: "Journal d'activité", url: "/dashboard/journal", icon: Activity, locked: false },
  { title: "Équipe", url: "/dashboard/equipe", icon: UsersRound, locked: false },
];

const bottomItems = [
  { title: "Paramètres", url: "/dashboard/parametres", icon: Settings },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null);

  interface SidebarProfile { prenom: string; nom: string; role: string; plan: string | null; avatar_url: string | null; }
  const [profile, setProfile] = useState<SidebarProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("prenom, nom, role, plan, avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const userRole = profile?.role ?? "freemium";
  const userPlan = profile?.plan ?? null;
  // User is freemium only if role is freemium AND no plan is set
  const isFreemium = userRole === "freemium" && !userPlan;
  const userName = profile ? `${profile.prenom} ${profile.nom}` : user?.email?.split("@")[0] ?? "Utilisateur";
  const initials = profile ? (profile.prenom[0] + profile.nom[0]).toUpperCase() : "DG";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleLockedClick = (title: string) => {
    if (isFreemium) {
      setUpgradeModal(title);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarContent className="pt-6">
          {/* Logo */}
          <div className={cn("px-4 mb-8 flex items-center gap-2", collapsed && "px-2 justify-center")}>
            <img src={digalLogo} alt="Digal" className={cn("transition-all", collapsed ? "h-7 w-7" : "h-8 w-8")} />
            {!collapsed && (
              <h1 className="font-serif font-bold text-sidebar-foreground text-2xl">Digal</h1>
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-sans">
              {!collapsed && "Menu"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => {
                  const isLocked = item.locked && isFreemium;

                  if (isLocked) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleLockedClick(item.title)}
                          className="text-sidebar-foreground/40 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors cursor-pointer"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="flex items-center gap-2 font-sans">
                              {item.title}
                              <Lock className="h-3 w-3" />
                              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full leading-none">
                                PRO
                              </span>
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="font-sans">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="font-sans">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-sans">Déconnexion</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* User info */}
          {!collapsed && (
            <div className="px-2 py-3 mt-2 border-t border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 bg-sidebar-accent">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-sans">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold font-sans text-sidebar-foreground truncate">
                    {userName}
                  </p>
                  <Badge
                    variant={isFreemium ? "outline" : "default"}
                    className={cn(
                      "text-[9px] px-1.5 py-0 mt-0.5",
                      isFreemium
                        ? "border-sidebar-border text-sidebar-foreground/50"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {isFreemium ? "Freemium" : (userPlan || userRole)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <ProUpgradeModal
        open={!!upgradeModal}
        onOpenChange={(open) => !open && setUpgradeModal(null)}
        featureName={upgradeModal ?? ""}
      />
    </>
  );
}
