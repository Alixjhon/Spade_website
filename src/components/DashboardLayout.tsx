import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Vote,
  Calendar,
  Users,
  FolderOpen,
  Video,
  Bell,
  Search,
  LogOut,
  Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockUser } from "@/lib/mock-data";
import { ROLES } from "@/lib/roles";
import spadeLogo from "@/assets/spade-logo.png";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Elections", url: "/dashboard/elections", icon: Trophy },
  { title: "Voting", url: "/dashboard/voting", icon: Vote },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Applicants", url: "/dashboard/applicants", icon: Users },
  { title: "Projects", url: "/dashboard/projects", icon: FolderOpen },
  { title: "Meetings", url: "/dashboard/meetings", icon: Video },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <div className={`flex items-center gap-3 px-4 mb-6 ${collapsed ? "justify-center" : ""}`}>
          <img src={spadeLogo} alt="SPADE" className="w-8 h-8" width={512} height={512} />
          {!collapsed && <span className="text-lg font-bold gradient-text">SPADE</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50 rounded-xl"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const DashboardLayout = () => {
  const navigate = useNavigate();
  const roleLabel = ROLES.find((r) => r.id === mockUser.role)?.label ?? mockUser.role;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden md:flex relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9 rounded-xl bg-muted/50 border-border/30" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative rounded-xl">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              </Button>
              <div className="flex items-center gap-3 pl-3 border-l border-border/50">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {mockUser.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground leading-none">{mockUser.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/")}>
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
