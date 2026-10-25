"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowRight, HeartHandshake, GraduationCap, CalendarDays, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(result.error || "Invalid email or password");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <section className="login-pattern relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 xl:p-20 text-white">
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl" aria-hidden="true">🕌</div>
          <div><p className="font-semibold tracking-wide">AL-MOMINEEN</p><p className="text-sm text-blue-200">Our community, connected.</p></div>
        </div>
        <div className="relative z-10 py-16">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.22em] text-blue-300">A place to belong</p>
          <h1 className="max-w-lg text-5xl xl:text-6xl font-semibold leading-[1.15] tracking-tight">Supporting the people<br />who bring us together.</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-300">One workspace for your masjid’s school, community programs, and daily operations.</p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-5 border-t border-white/15 pt-7">
            {[{ Icon: HeartHandshake, label: 'Community' }, { Icon: GraduationCap, label: 'Education' }, { Icon: CalendarDays, label: 'Programs' }].map(({ Icon, label }) => (
              <div key={label} className="space-y-3"><Icon className="h-6 w-6 text-blue-300" /><p className="text-sm text-slate-200">{label}</p></div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-slate-400">Masjid Al-Momineen · Staff & administration</p>
      </section>
      <main className="flex min-h-screen items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 mb-4">
            <span className="text-2xl">🕌</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your Al-Momineen workspace</p>
        </div>

        <Card className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-slate-200/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    autoComplete="username"
                    type="email"
                    placeholder="admin@almomineen.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="hidden">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <Button
                type="submit"
                className="mt-2 w-full h-11 bg-blue-700 hover:bg-blue-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>Sign in to workspace <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="flex justify-center items-center gap-1.5 text-center text-xs text-gray-500 mt-6"><ShieldCheck className="h-3.5 w-3.5" />
          © {new Date().getFullYear()} Masjid Al-Momineen. All rights reserved.
        </p>
      </div>
      </main>
    </div>
  );
}
