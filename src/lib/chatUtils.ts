import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export const formatMessageTime = (date: Date) => format(date, "h:mm a");

export const formatLastSeen = (date: Date) => {
  if (isToday(date)) return `today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `yesterday at ${format(date, "h:mm a")}`;
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatChatTime = (date: Date) => {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MM/dd/yy");
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
