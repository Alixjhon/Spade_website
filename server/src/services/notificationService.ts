import {
  createNotificationForActiveUsers,
  listUnreadNotificationsForUser,
  markNotificationRead,
  type NotificationRecord,
} from "../repositories/notificationRepository.js";

function serializeNotification(record: NotificationRecord) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    message: record.message,
    actionUrl: record.action_url,
    createdAt: new Date(record.created_at).getTime(),
  };
}

export async function notifyActiveUsersMeetingStarted(input: {
  roomId: string;
  title: string;
  hostName: string;
}) {
  await createNotificationForActiveUsers({
    type: "meeting-started",
    title: "Meeting started",
    message: `${input.hostName} started ${input.title}. Tap to join.`,
    actionUrl: `/dashboard/meetings?room=${encodeURIComponent(input.roomId)}`,
  });
}

export async function getUnreadNotifications(userEmail: string) {
  const notifications = await listUnreadNotificationsForUser(userEmail);
  return notifications.map(serializeNotification);
}

export async function readNotification(input: { id: number; userEmail: string }) {
  return markNotificationRead(input);
}
