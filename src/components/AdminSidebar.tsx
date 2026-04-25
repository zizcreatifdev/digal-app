import {
  LayoutDashboard, Users, ClipboardList, KeyRound, Mail, Receipt,
  BookOpen, FileText, ShieldCheck, LogOut, ChevronDown, Tag, PenTool, UserCog, Settings2, Users2, MessageSquareQuote,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Mon Profil", url: "/admin/profil", icon: UserCog },
];

const userSubItems = [
  { title: "Liste d'attente", url: "/admin/waitlist", icon: ClipboardList },
  { title: "Comptes", url: "/admin/comptes", icon: Users },
  { title: "Licences", url: "/admin/licences", icon: KeyRound },
  { title: "Parrainages", url: "/admin/parrainages", icon: Users2 },
];

const otherItems = [
  { title: "Formules & Tarifs", url: "/admin/plans", icon: Tag },
  { title: "Témoignages", url: "/admin/temoignages", icon: MessageSquareQuote },
  { title: "Contrats", url: "/admin/contrats", icon: PenTool },
  { title: "Emails marketing", url: "/admin/emails", icon: Mail },
  { title: "Facturation Owner", url: "/admin/facturation", icon: Receipt },
  { title: "Guides plateforme", url: "/admin/guides", icon: BookOpen },
  { title: "Documentation", url: "/admin/documentation", icon: FileText },
  { title: "Sécurité & Journal", url: "/admin/securite", icon: ShieldCheck },
  { title: "Paramètres plateforme", url: "/admin/plateforme", icon: Settings2 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [usersOpen, setUsersOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6">
        <div className={cn("px-4 mb-8 flex flex-col items-start", collapsed && "px-2 items-center")}>
          {collapsed ? (
            <img
              src="/logos/Logo%20Digal-icon_orange_sansbaseline.svg"
              alt="Digal"
              className="h-7 w-7 transition-all"
            />
          ) : (
            <>
              <img
                src="/logos/Logo%20Digal_iconorange_ettext_enblanc.svg"
                alt="Digal"
                className="h-8 w-auto transition-all"
              />
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-sans mt-0.5">Admin</span>
            </>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="!rounded-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/10 transition-all duration-200"
                      activeClassName="!rounded-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-sans">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-sans cursor-pointer flex items-center justify-between w-full">
                {!collapsed && "Utilisateurs"}
                {!collapsed && <ChevronDown className={cn("h-3 w-3 transition-transform", usersOpen && "rotate-180")} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userSubItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="font-sans">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-sans">
            {!collapsed && "Gestion"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="!rounded-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/10 transition-all duration-200"
                      activeClassName="!rounded-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-sans">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
      </SidebarFooter>
    </Sidebar>
  );
}
