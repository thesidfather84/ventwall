/**
 * My Echoes — Premium feature page
 *
 * FUTURE PAYMENT INTEGRATION (Stripe):
 * ------------------------------------
 * 1. Install: pnpm add stripe @stripe/stripe-js
 * 2. Create a Stripe subscription product: "VentWall Plus" at $2.99/month
 * 3. Add env vars: STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * 4. Add DB column: users.isPremium: boolean (default false)
 * 5. API route: POST /api/billing/checkout → create Stripe Checkout session
 * 6. API route: POST /api/billing/webhook → handle subscription events
 * 7. Replace the upsell below with the actual My Echoes dashboard
 *    when user.isPremium === true
 *
 * Premium access check (pseudocode):
 *   const isPremium = await checkUserSubscription(sessionId);
 *   if (!isPremium) return <PremiumUpsell />;
 *   return <MyEchoesDashboard />;
 */

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Bookmark, FileText, History, StickyNote, Clock, Palette, Music, Lock } from "lucide-react";

const PREMIUM_FEATURES = [
  { icon: Bookmark, label: "Save favorite vents", desc: "Bookmark the posts that stay with you." },
  { icon: History, label: "View your Echo history", desc: "See every post you've reacted to." },
  { icon: FileText, label: "Posts you reacted to", desc: "Revisit the thoughts you connected with." },
  { icon: StickyNote, label: "Keep private notes", desc: "Attach personal notes to any vent." },
  { icon: Clock, label: "Longer post history", desc: "Your vents stay live for 30 days instead of 7." },
  { icon: Palette, label: "Custom wall themes", desc: "Choose your own candlelight palette." },
  { icon: Music, label: "Soundscape packs", desc: "Ambient sound while you read the wall." },
];

export default function MyEchoes() {
  return (
    <Layout>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/feed">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <span className="font-typewriter text-lg text-primary tracking-widest">My Echoes</span>
        </header>

        <div
          className="max-w-md mx-auto px-4 pt-8 pb-32 flex flex-col items-center gap-8"
          style={{ fontFamily: "'Special Elite', 'Courier New', monospace" }}
        >
          {/* Lock icon */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center relative"
              style={{
                background: "radial-gradient(ellipse at 30% 25%, #2a2018 0%, #0e0b07 100%)",
                border: "1px solid rgba(180,120,40,0.3)",
                boxShadow: "0 0 32px -8px rgba(212,144,10,0.5)",
              }}
            >
              <Bookmark className="w-8 h-8 text-primary" />
              <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: "#1a1208",
                  border: "1px solid rgba(180,120,40,0.4)",
                }}
              >
                <Lock className="w-3 h-3 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="font-typewriter text-2xl text-primary tracking-widest uppercase">
                My Echoes
              </h1>
              <p className="font-serif italic text-muted-foreground text-base leading-relaxed">
                Save the thoughts that hit you hardest.
              </p>
            </div>

            {/* Coming soon badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest"
              style={{
                background: "rgba(212,144,10,0.08)",
                border: "1px solid rgba(212,144,10,0.25)",
                color: "rgba(212,144,10,0.8)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              Coming Soon
            </div>
          </div>

          {/* Features list — parchment card */}
          <div
            className="parchment w-full rounded-sm p-6 space-y-4"
            style={{ clipPath: "polygon(0 0, 100% 0, 99% 100%, 1% 98%)" }}
          >
            <p className="text-[11px] font-mono text-[#5a4530] uppercase tracking-widest border-b border-[#3d2b1f]/10 pb-2">
              VentWall Plus Features
            </p>
            <div className="space-y-3">
              {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: "rgba(212,144,10,0.08)",
                      border: "1px solid rgba(212,144,10,0.2)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div>
                    <p className="text-sm font-typewriter text-[#3d2b1f] leading-tight">{label}</p>
                    <p className="text-xs font-serif italic text-[#5a4530] leading-tight mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="w-full space-y-3 text-center">
            <Button
              disabled
              className="w-full h-14 text-sm font-typewriter tracking-[0.15em] uppercase bg-primary/50 text-primary-foreground/70 rounded-sm border-b-4 border-[#b47828]/50 cursor-not-allowed"
            >
              {/* TODO: onClick → initiate Stripe Checkout session */}
              Unlock VentWall Plus
            </Button>
            <div className="space-y-1">
              <p className="font-serif italic text-muted-foreground text-sm">
                VentWall Plus — <span className="text-primary font-typewriter">$2.99/month</span>
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                Payments not yet available · Stay tuned
              </p>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/feed"
            className="text-xs font-mono text-muted-foreground hover:text-white transition-colors uppercase tracking-widest"
          >
            ← Back to the wall
          </Link>
        </div>
      </div>
    </Layout>
  );
}
