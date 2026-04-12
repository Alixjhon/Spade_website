import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Calendar,
  ClipboardCheck,
  FolderOpen,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roles";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const iconMap: Record<string, React.ElementType> = {
  Users,
  FolderOpen,
  Calendar,
  ClipboardCheck,
};

const activityStyles: Record<string, string> = {
  project: "bg-sky-100 text-sky-700",
  event: "bg-amber-100 text-amber-700",
  vote: "bg-violet-100 text-violet-700",
  applicant: "bg-emerald-100 text-emerald-700",
  member: "bg-rose-100 text-rose-700",
  activity: "bg-slate-100 text-slate-700",
};

const quickActions = [
  {
    title: "Review applicants",
    description: "Approve pending member requests and check project submissions.",
    to: "/dashboard/applicants",
    icon: Users,
  },
  {
    title: "Manage events",
    description: "Publish upcoming activities and keep attendance visible.",
    to: "/dashboard/events",
    icon: Calendar,
  },
  {
    title: "Open meetings",
    description: "Launch a live room or continue an existing team call.",
    to: "/dashboard/meetings",
    icon: Video,
  },
  {
    title: "Track projects",
    description: "Monitor assignments, submissions, and classroom output.",
    to: "/dashboard/projects",
    icon: FolderOpen,
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const DashboardPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.email],
    queryFn: () => api.getDashboard(user!.email),
    enabled: Boolean(user?.email),
  });

  const dashboardUser = data?.user ?? user;
  const stats = data?.stats ?? [];
  const activities = data?.activities ?? [];
  const roleLabel = dashboardUser ? ROLES.find((role) => role.id === dashboardUser.role)?.label ?? dashboardUser.role : "";
  const headlineStat = stats[0];
  const supportingStats = stats.slice(1);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-border/50 bg-[linear-gradient(135deg,rgba(245,251,255,0.98),rgba(226,239,255,0.98),rgba(255,242,229,0.96))] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 top-0 h-52 w-52 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-[24rem] flex-col justify-between space-y-10">
            <div className="space-y-7">
              <Badge className="w-fit border-0 bg-white/80 px-4 py-1.5 text-slate-900">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                SPADE command center
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                  Welcome back, {dashboardUser?.name || "Member"}.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-800/80 sm:text-lg xl:text-xl xl:leading-9">
                  This dashboard keeps your meetings, events, applicants, and project activity in one place so you can immediately see what needs attention, what is moving, and where the organization needs your next decision.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge className="rounded-full border-0 bg-slate-900 px-4 py-1.5 text-white">{roleLabel || "Member"}</Badge>
                {dashboardUser?.course ? (
                  <Badge variant="secondary" className="rounded-full px-4 py-1.5">
                    {dashboardUser.course}
                  </Badge>
                ) : null}
                {dashboardUser?.location ? (
                  <Badge variant="secondary" className="rounded-full px-4 py-1.5">
                    {dashboardUser.location}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="max-w-3xl space-y-4 rounded-[1.9rem] border border-white/30 bg-white/65 px-6 py-6 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-700">Operational snapshot</p>
              <p className="text-lg leading-8 text-slate-800/80 xl:text-xl xl:leading-9">
                You currently have <span className="font-semibold text-slate-950">{activities.length}</span> fresh updates on the board, with live visibility into member approvals, scheduled events, project output, election movement, and meeting activity.
              </p>
            </div>
          </div>

           <div className="grid gap-3 sm:grid-cols-2 lg:auto-rows-fr lg:self-end">
             <div className="rounded-[1.7rem] border border-white/30 bg-white/75 p-5 shadow-sm sm:col-span-2">
               <p className="text-xs uppercase tracking-[0.22em] text-slate-700">Overview</p>
               {headlineStat ? (
                 <>
                   <p className="mt-3 text-4xl font-semibold text-slate-950">{headlineStat.value}</p>
                   <div className="mt-2 flex items-center justify-between gap-3">
                     <p className="text-sm text-slate-800/75">{headlineStat.label}</p>
                     <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                       <TrendingUp className="h-3.5 w-3.5" />
                       {headlineStat.change}
                     </span>
                   </div>
                 </>
               ) : (
                 <div className="mt-3 space-y-4">
                   <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-200/70" />
                   <div className="flex items-center justify-between gap-3">
                     <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
                     <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200/70" />
                   </div>
                 </div>
               )}
             </div>

             {supportingStats.length > 0 ? supportingStats.map((stat) => {
               const Icon = iconMap[stat.icon] || Activity;

               return (
                 <div key={stat.label} className="rounded-[1.5rem] border border-white/25 bg-white/70 p-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                       <Icon className="h-4 w-4" />
                     </div>
                     <span className="text-xs font-medium text-slate-700">{stat.change}</span>
                   </div>
                   <p className="mt-4 text-2xl font-semibold text-slate-950">{stat.value}</p>
                   <p className="mt-1 text-sm text-slate-800/75">{stat.label}</p>
                 </div>
               );
             }) : (
               <>
                 <div className="rounded-[1.5rem] border border-white/25 bg-white/70 p-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                       <Users className="h-4 w-4" />
                     </div>
                     <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200/70" />
                   </div>
                   <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-200/70" />
                   <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-200/70" />
                 </div>
                 <div className="rounded-[1.5rem] border border-white/25 bg-white/70 p-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                       <Calendar className="h-4 w-4" />
                     </div>
                     <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200/70" />
                   </div>
                   <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-200/70" />
                   <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-200/70" />
                 </div>
                 <div className="rounded-[1.5rem] border border-white/25 bg-white/70 p-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                       <FolderOpen className="h-4 w-4" />
                     </div>
                     <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200/70" />
                   </div>
                   <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-200/70" />
                   <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-200/70" />
                 </div>
                 <div className="rounded-[1.5rem] border border-white/25 bg-white/70 p-4 shadow-sm">
                   <div className="flex items-center justify-between">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                       <ClipboardCheck className="h-4 w-4" />
                     </div>
                     <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200/70" />
                   </div>
                   <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-200/70" />
                   <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-200/70" />
                 </div>
               </>
             )}
           </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.to}
              className="group rounded-[1.75rem] border border-border/50 bg-card/75 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-sm">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest movement across members, events, voting, and project work.</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {activities.length} updates
            </Badge>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-start gap-4 rounded-2xl border border-border/40 p-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-200" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-border/60 bg-background/60 p-8 text-center">
                <p className="text-base font-semibold text-foreground">No recent activity</p>
                <p className="mt-2 text-sm text-muted-foreground">New dashboard activity will appear here once members start using the system.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 rounded-2xl border border-border/40 p-4 transition hover:bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary">
                    <span className="text-xs font-bold text-primary-foreground">{getInitials(activity.user)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${activityStyles[activity.type] ?? activityStyles.activity}`}>
                        {activity.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(246,248,252,0.96))] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Admin focus</h2>
                <p className="text-sm text-muted-foreground">Recommended actions based on your control surfaces.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">Applicant reviews</p>
                <p className="mt-1 text-sm text-muted-foreground">Check pending approvals and validate project evidence from incoming members.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">Event planning</p>
                <p className="mt-1 text-sm text-muted-foreground">Keep your event board updated so members see the latest schedules first.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">Meeting readiness</p>
                <p className="mt-1 text-sm text-muted-foreground">Launch or monitor meeting rooms before live sessions begin.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Action lane</h2>
                <p className="mt-1 text-sm text-muted-foreground">Move quickly to the areas that usually need attention first.</p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                3 routes
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              <Link
                to="/dashboard/elections"
                className="group flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-4 transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium text-foreground">Election management</p>
                  <p className="mt-1 text-sm text-muted-foreground">Update schedules, filing windows, and voting readiness.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
              <Link
                to="/dashboard/voting"
                className="group flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-4 transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium text-foreground">Voting results</p>
                  <p className="mt-1 text-sm text-muted-foreground">Review participation and candidate movement.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
              <Link
                to="/dashboard/projects"
                className="group flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-4 transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium text-foreground">Project review</p>
                  <p className="mt-1 text-sm text-muted-foreground">Check classroom submissions and output quality.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
