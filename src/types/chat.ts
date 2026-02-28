export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
  lastSeen: Date;
  phone?: string;
  email?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document" | "audio";
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isHidden?: boolean;
}
