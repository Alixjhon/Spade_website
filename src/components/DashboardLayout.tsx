import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  Camera,
  PencilLine,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roles";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import spadeLogo from "@/assets/spade-logo.png";

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const getInitials = (name?: string) =>
  name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SP";

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
  const queryClient = useQueryClient();
  const { user, signOut, updateUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const roleLabel = user ? ROLES.find((r) => r.id === user.role)?.label ?? user.role : "";
  const currentInitials = getInitials(user?.name);
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", user?.email],
    queryFn: () => api.getDashboard(user!.email),
    enabled: Boolean(user?.email),
  });

  useEffect(() => {
    setName(user?.name || "");
    setLocation(user?.location || "");
    setCourse(user?.course || "");
    setYearLevel(user?.yearLevel || "");
    setContactNumber(user?.contactNumber || "");
    setProfilePictureUrl(user?.profilePictureUrl || "");
  }, [user]);

  useEffect(() => {
    if (!dashboardData?.user || !user) return;

    const nextUser = dashboardData.user;
    if (
      nextUser.role !== user.role ||
      nextUser.name !== user.name ||
      nextUser.location !== user.location ||
      nextUser.course !== user.course ||
      nextUser.yearLevel !== user.yearLevel ||
      nextUser.contactNumber !== user.contactNumber ||
      nextUser.profilePictureUrl !== user.profilePictureUrl
    ) {
      updateUser(nextUser);
    }
  }, [dashboardData?.user, updateUser, user]);

  const profileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: ({ user: updatedUser }) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile updated.");
      setIsProfileOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const hasProfileChanges = useMemo(
    () =>
      name !== (user?.name || "") ||
      location !== (user?.location || "") ||
      course !== (user?.course || "") ||
      yearLevel !== (user?.yearLevel || "") ||
      contactNumber !== (user?.contactNumber || "") ||
      profilePictureUrl !== (user?.profilePictureUrl || ""),
    [contactNumber, course, location, name, profilePictureUrl, user, yearLevel],
  );

  const handleProfilePictureChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProfilePictureUrl(await toDataUrl(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read image.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveProfile = () => {
    if (!user?.email) return;

    profileMutation.mutate({
      email: user.email,
      name,
      location,
      course,
      yearLevel,
      contactNumber,
      profilePictureUrl,
    });
  };

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
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/70 px-2 py-2 transition hover:border-primary/40 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                      <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "Profile"} className="object-cover" />
                      <AvatarFallback className="gradient-primary text-xs font-bold text-primary-foreground">
                        {currentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition group-hover:scale-105">
                      <PencilLine className="h-3 w-3" />
                    </span>
                  </div>
                </button>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                >
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
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.98))] p-0 sm:max-w-xl">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_right,rgba(125,197,255,0.35),transparent_44%),linear-gradient(135deg,rgba(8,47,73,0.98),rgba(14,116,144,0.9),rgba(251,146,60,0.72))]" />
            <div className="absolute right-8 top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 px-6 pb-8 pt-6 sm:px-8">
              <SheetHeader className="space-y-2 text-left">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Profile studio
                </div>
                <SheetTitle className="text-2xl text-white">Update your profile</SheetTitle>
                <SheetDescription className="max-w-md text-white/75">
                  Refresh your photo and details from one panel. Changes apply to your dashboard immediately.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-8 rounded-[2rem] border border-white/20 bg-white/12 p-4 backdrop-blur-md">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative w-fit">
                    <Avatar className="h-28 w-28 ring-4 ring-white/25 shadow-2xl">
                      <AvatarImage src={profilePictureUrl} alt={name || "Profile preview"} className="object-cover" />
                      <AvatarFallback className="gradient-primary text-2xl font-bold text-primary-foreground">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="profile-photo-upload"
                      className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePictureChange}
                    />
                  </div>

                  <div className="min-w-0 flex-1 text-white">
                    <p className="text-xl font-semibold">{name || "Your profile"}</p>
                    <p className="mt-1 text-sm text-white/75">{user?.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90">
                        {roleLabel || "Member"}
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90">
                        {course || "Course not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-8 sm:px-8">
            <div className="-mt-2 rounded-[2rem] border border-border/60 bg-background/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="h-12 rounded-2xl border-border/60 bg-white/80 px-4 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-location">Location</Label>
                  <Input
                    id="profile-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="City / Municipality"
                    className="h-12 rounded-2xl border-border/60 bg-white/80 px-4 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-contact">Contact Number</Label>
                  <Input
                    id="profile-contact"
                    value={contactNumber}
                    onChange={(event) => setContactNumber(event.target.value)}
                    placeholder="09xxxxxxxxx"
                    className="h-12 rounded-2xl border-border/60 bg-white/80 px-4 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-course">Course</Label>
                  <Input
                    id="profile-course"
                    value={course}
                    onChange={(event) => setCourse(event.target.value)}
                    placeholder="e.g. BSIT"
                    className="h-12 rounded-2xl border-border/60 bg-white/80 px-4 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-year">Year Level</Label>
                  <Input
                    id="profile-year"
                    value={yearLevel}
                    onChange={(event) => setYearLevel(event.target.value)}
                    placeholder="e.g. 2nd Year"
                    className="h-12 rounded-2xl border-border/60 bg-white/80 px-4 shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">UX details</p>
                <p>Your photo updates instantly in the preview before you save, so you can confirm the crop and feel.</p>
                <p>Your dashboard session is refreshed after saving, so the new avatar and details appear immediately.</p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setName(user?.name || "");
                    setLocation(user?.location || "");
                    setCourse(user?.course || "");
                    setYearLevel(user?.yearLevel || "");
                    setContactNumber(user?.contactNumber || "");
                    setProfilePictureUrl(user?.profilePictureUrl || "");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileMutation.isPending || !hasProfileChanges}
                  className="rounded-2xl gradient-primary px-6 text-primary-foreground"
                >
                  {profileMutation.isPending ? "Saving..." : hasProfileChanges ? "Save changes" : "No changes yet"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
};

export default DashboardLayout;
