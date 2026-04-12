export function toDateOnly(dateValue: string | Date): string {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export function toRelativeTime(dateValue: string | Date): string {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
