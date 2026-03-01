import { getInitials } from "@/lib/chatUtils";

interface AvatarCircleProps {
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
};

const dotSizeMap = {
  sm: "h-2.5 w-2.5 border",
  md: "h-3 w-3 border-2",
  lg: "h-4 w-4 border-2",
};

const colors = [
  "bg-emerald-600", "bg-sky-600", "bg-violet-600",
  "bg-amber-600", "bg-rose-600", "bg-teal-600",
];

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const AvatarCircle = ({ name, avatarUrl, isOnline, size = "md" }: AvatarCircleProps) => (
  <div className="relative flex-shrink-0">
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover border border-border/50`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement?.querySelector('.initials-fallback')?.classList.remove('hidden');
        }}
      />
    ) : null}
    <div
      className={`${sizeMap[size]} ${getColor(name)} rounded-full flex items-center justify-center font-semibold text-white initials-fallback ${avatarUrl ? 'hidden' : ''}`}
    >
      {getInitials(name)}
    </div>
    {isOnline !== undefined && (
      <span
        className={`absolute bottom-0 right-0 ${dotSizeMap[size]} rounded-full border-chat-sidebar ${isOnline ? "bg-online" : "bg-muted-foreground"
          }`}
      />
    )}
  </div>
);

export default AvatarCircle;
