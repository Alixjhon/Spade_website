import { Users, FolderOpen, Calendar, ClipboardCheck, Activity, TrendingUp } from "lucide-react";
import { mockStats, mockActivities, mockUser } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/roles";

const iconMap: Record<string, React.ElementType> = { Users, FolderOpen, Calendar, ClipboardCheck };

const DashboardPage = () => {
  const roleLabel = ROLES.find((r) => r.id === mockUser.role)?.label ?? mockUser.role;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card-elevated p-8 gradient-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-2xl font-bold text-primary-foreground">Welcome back, {mockUser.name}! 👋</h1>
        <p className="text-primary-foreground/80 mt-1">Here's what's happening with SPADE today.</p>
        <Badge className="mt-3 bg-primary-foreground/20 text-primary-foreground border-none">{roleLabel}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, i) => {
          const Icon = iconMap[stat.icon] || Activity;
          return (
            <div key={i} className="glass-card hover-lift p-6 space-y-3" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {stat.change}
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {activity.user.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
