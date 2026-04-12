import { toRelativeTime } from "../lib/date.js";
import { listRecentActivities } from "../repositories/activityRepository.js";
import { countProjects, countUpcomingEvents } from "../repositories/contentRepository.js";
import { countActiveUsers, countPendingUsers, findUserSummary } from "../repositories/userRepository.js";

function formatActorName(value: string) {
  if (!value.includes("@")) {
    return value;
  }

  return value
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function getDashboard(email: string) {
  const [user, activeUsers, totalProjects, upcomingEvents, pendingUsers, recentActivities] = await Promise.all([
    findUserSummary(email),
    countActiveUsers(),
    countProjects(),
    countUpcomingEvents(),
    countPendingUsers(),
    listRecentActivities(),
  ]);

  return {
    user,
    stats: [
      { label: "Total Members", value: String(activeUsers), change: "Live", icon: "Users" },
      { label: "Active Projects", value: String(totalProjects), change: "Tracked", icon: "FolderOpen" },
      { label: "Upcoming Events", value: String(upcomingEvents), change: "Scheduled", icon: "Calendar" },
      { label: "Pending Approvals", value: String(pendingUsers), change: "Action needed", icon: "ClipboardCheck" },
    ],
    activities: recentActivities.map((activity) => ({
      id: activity.id,
      user: formatActorName(activity.user_name),
      action: activity.action,
      type: activity.type,
      time: toRelativeTime(activity.created_at),
    })),
  };
}
