import { User, Message, Chat } from "@/types/chat";

export const currentUser: User = {
  id: "me",
  name: "You",
  username: "you",
  avatar: "",
  bio: "Hey there! I am using PingMe",
  isOnline: true,
  lastSeen: new Date(),
};

export const users: User[] = [
  { id: "1", name: "Sarah Chen", username: "sarach", avatar: "", bio: "Design lead @Figma", isOnline: true, lastSeen: new Date() },
  { id: "2", name: "Marcus Johnson", username: "marcusj", avatar: "", bio: "Full-stack dev 🚀", isOnline: false, lastSeen: new Date(Date.now() - 1800000) },
  { id: "3", name: "Aisha Patel", username: "aishap", avatar: "", bio: "Product Manager", isOnline: true, lastSeen: new Date() },
  { id: "4", name: "Leo Martinez", username: "leom", avatar: "", bio: "Coffee & Code ☕", isOnline: false, lastSeen: new Date(Date.now() - 7200000) },
  { id: "5", name: "Emma Wilson", username: "emmaw", avatar: "", bio: "UX Researcher", isOnline: true, lastSeen: new Date() },
  { id: "6", name: "Nova AI", username: "nova", avatar: "", bio: "Your AI assistant 🤖", isOnline: true, lastSeen: new Date() },
];

const now = Date.now();

export const messages: Record<string, Message[]> = {
  "chat-1": [
    { id: "m1", chatId: "chat-1", senderId: "1", text: "Hey! Did you see the new design system?", timestamp: new Date(now - 3600000), status: "read" },
    { id: "m2", chatId: "chat-1", senderId: "me", text: "Yes! It looks amazing. Love the color palette 🎨", timestamp: new Date(now - 3500000), status: "read" },
    { id: "m3", chatId: "chat-1", senderId: "1", text: "Right? The dark mode is *chef's kiss*", timestamp: new Date(now - 3400000), status: "read" },
    { id: "m4", chatId: "chat-1", senderId: "me", text: "We should implement it in PingMe", timestamp: new Date(now - 3300000), status: "read", edited: true },
    { id: "m5", chatId: "chat-1", senderId: "1", text: "Already on it! Check the Figma link I sent", timestamp: new Date(now - 600000), status: "read" },
    { id: "m6", chatId: "chat-1", senderId: "me", text: "Perfect, I'll review it tonight", timestamp: new Date(now - 300000), status: "delivered" },
  ],
  "chat-2": [
    { id: "m7", chatId: "chat-2", senderId: "2", text: "The API is ready for testing", timestamp: new Date(now - 7200000), status: "read" },
    { id: "m8", chatId: "chat-2", senderId: "me", text: "Great! Any breaking changes?", timestamp: new Date(now - 7100000), status: "read" },
    { id: "m9", chatId: "chat-2", senderId: "2", text: "Nope, fully backward compatible 👍", timestamp: new Date(now - 5400000), status: "read" },
  ],
  "chat-3": [
    { id: "m10", chatId: "chat-3", senderId: "3", text: "Sprint planning at 3pm today", timestamp: new Date(now - 1800000), status: "read" },
    { id: "m11", chatId: "chat-3", senderId: "me", text: "I'll be there!", timestamp: new Date(now - 1700000), status: "read" },
    { id: "m12", chatId: "chat-3", senderId: "3", text: "Bring your feature proposals 📋", timestamp: new Date(now - 900000), status: "read" },
  ],
  "chat-4": [
    { id: "m13", chatId: "chat-4", senderId: "4", text: "Found a great coffee shop near the office", timestamp: new Date(now - 86400000), status: "read" },
    { id: "m14", chatId: "chat-4", senderId: "me", text: "Send me the location!", timestamp: new Date(now - 85000000), status: "read" },
  ],
  "chat-5": [
    { id: "m15", chatId: "chat-5", senderId: "5", text: "The user testing results are in", timestamp: new Date(now - 43200000), status: "read" },
    { id: "m16", chatId: "chat-5", senderId: "me", text: "How did it go?", timestamp: new Date(now - 42000000), status: "read" },
    { id: "m17", chatId: "chat-5", senderId: "5", text: "93% satisfaction rate! 🎉", timestamp: new Date(now - 41000000), status: "read" },
  ],
  "chat-6": [
    { id: "m18", chatId: "chat-6", senderId: "6", text: "Hi! I'm Nova, your AI assistant. How can I help you today? 🤖", timestamp: new Date(now - 100000), status: "read" },
  ],
};

export const chats: Chat[] = [
  { id: "chat-1", participants: ["me", "1"], lastMessage: messages["chat-1"][5], unreadCount: 0, isPinned: true },
  { id: "chat-3", participants: ["me", "3"], lastMessage: messages["chat-3"][2], unreadCount: 1 },
  { id: "chat-6", participants: ["me", "6"], lastMessage: messages["chat-6"][0], unreadCount: 1 },
  { id: "chat-2", participants: ["me", "2"], lastMessage: messages["chat-2"][2], unreadCount: 0 },
  { id: "chat-5", participants: ["me", "5"], lastMessage: messages["chat-5"][2], unreadCount: 0 },
  { id: "chat-4", participants: ["me", "4"], lastMessage: messages["chat-4"][1], unreadCount: 0 },
];
