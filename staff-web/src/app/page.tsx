"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cream-100">
      {/* Organic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-[100%] bg-mocha-400 opacity-20 blur-[120px] mix-blend-multiply animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] rounded-[100%] bg-mocha-600 opacity-15 blur-[100px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vh] rounded-[100%] bg-white opacity-40 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in p-6">
        
        {/* Dynamic Mocha Card */}
        <div className="mocha-gradient rounded-[2.5rem] p-10 shadow-elegant-dark flex flex-col relative overflow-hidden">
          {/* Decorative glass overlay inside card */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-black/10 blur-2xl rounded-full" />

          {/* Header */}
          <div className="text-center mb-10 relative z-10 space-y-3">
            <h1 className="font-serif text-5xl tracking-tight font-medium text-white mb-2 leading-tight">
              Masjid <br/> <span className="text-cream-100/90 italic">Al-Momineen</span>
            </h1>
            <p className="font-sans text-cream-100/70 text-sm tracking-wide uppercase">Staff Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-4 text-sm text-cream-100 animate-slide-in text-center shadow-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-cream-100/80 pl-2 text-xs font-medium uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@almomineen.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-cream-100 focus-visible:border-transparent rounded-full h-14 px-6 shadow-inner backdrop-blur-md transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-cream-100/80 pl-2 text-xs font-medium uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-cream-100 focus-visible:border-transparent rounded-full h-14 px-6 shadow-inner backdrop-blur-md transition-all"
              />
            </div>

            {/* Honeypot */}
            <div className="hidden">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-white hover:bg-cream-100 text-mocha-900 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] mt-4"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-mocha-900 border-t-transparent" />
                  Authenticating...
                </span>
              ) : (
                "Sign Into Portal"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs font-sans tracking-widest text-mocha-600/60 mt-8 uppercase">
          © {new Date().getFullYear()} Masjid Al-Momineen
        </p>
      </div>
    </div>
  );
}
