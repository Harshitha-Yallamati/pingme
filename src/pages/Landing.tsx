import { Link } from "react-router-dom";
import { MessageCircle, Shield, Zap, Lock, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const features = [
  { icon: Shield, title: "End-to-End Encrypted", desc: "Your messages are secured with AES encryption and RSA key exchange." },
  { icon: Zap, title: "Real-Time Messaging", desc: "Instant delivery with typing indicators and read receipts." },
  { icon: Lock, title: "Hidden Chats", desc: "PIN-protect sensitive conversations from prying eyes." },
];

const Landing = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">PingMe</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Lock className="h-3.5 w-3.5" />
          Secure by default
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-tight tracking-tight">
          Messaging that
          <span className="text-primary"> respects </span>
          your privacy
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl">
          PingMe delivers lightning-fast, end-to-end encrypted messaging. Your conversations stay yours.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity text-base"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted transition-colors text-base"
          >
            Log in
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20 pt-10">
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-6 text-left">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border">
        © 2026 PingMe. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
