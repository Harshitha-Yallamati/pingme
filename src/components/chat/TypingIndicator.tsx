const TypingIndicator = () => (
  <div className="flex items-end gap-2 px-4 animate-fade-in">
    <div className="bg-chat-bubble-received rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground"
          style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  </div>
);

export default TypingIndicator;
