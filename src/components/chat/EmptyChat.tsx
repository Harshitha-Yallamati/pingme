import Logo from "@/components/Logo";

const EmptyChat = () => (
  <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-chat-bg">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Logo className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">PingMe Web</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Send and receive messages securely. Select a chat to start messaging.
        </p>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        End-to-end encrypted
      </div>
    </div>
  </div>
);

export default EmptyChat;
