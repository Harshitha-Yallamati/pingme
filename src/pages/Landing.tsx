import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Zap, Lock, ArrowRight, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import Logo from "@/components/Logo";

const Landing = () => {
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const isDark = theme === "dark";

  return (
    <div className={`min-h-[100dvh] transition-colors duration-300 ${isDark ? "dark bg-slate-950" : "bg-white"}`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                PingMe
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Logo className="h-4 w-4" />
            <span>Secure. Private. Fast.</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 dark:text-white">
            Connect with anyone,{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent italic">
              anywhere.
            </span>
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
            Experience the next generation of messaging. Secure, beautiful, and blazing fast.
            Join thousands of users communicating without boundaries.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-primary text-primary-foreground h-12 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto h-12 px-8 rounded-xl font-semibold border text-slate-900 dark:text-white hover:bg-muted transition-colors"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Logo className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Chat</h3>
              <p className="text-muted-foreground text-sm">
                Instant messaging with delivery status and real-time typing indicators.
              </p>
            </div>

            <div className="bg-background p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-muted-foreground text-sm">
                Your messages are encrypted before they even leave your device.
              </p>
            </div>

            <div className="bg-background p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Blazing Fast</h3>
              <p className="text-muted-foreground text-sm">
                Built on high-performance infrastructure for minimum latency.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border">
        © 2026 PingMe. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
