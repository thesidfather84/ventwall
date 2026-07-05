import React, { useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useGetFeedSummary, getGetFeedSummaryQueryKey } from "@workspace/api-client-react";
import {
  LayoutGrid,
  Flame,
  Bookmark,
  PenLine,
  Shield,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { AmbientBackground } from "./ambient-background";
import { AmbientControl } from "./ambient-control";

// Custom event name for focusing the composer from any sidebar
export const FOCUS_COMPOSER_EVENT = "vw:focus-composer";

export function Layout({ children, hideFab }: { children: React.ReactNode; hideFab?: boolean }) {
  const [location, navigate] = useLocation();

  const { data: summary } = useGetFeedSummary({
    query: {
      queryKey: getGetFeedSummaryQueryKey(),
      refetchInterval: 30000,
    },
  });

  // Write button: navigate to /feed, then fire focus-composer event
  const handleWriteClick = useCallback(() => {
    const fire = () =>
      window.dispatchEvent(new CustomEvent(FOCUS_COMPOSER_EVENT));

    if (location !== "/feed") {
      // Navigate first, then fire after a small delay so the feed mounts
      navigate("/feed");
      setTimeout(fire, 350);
    } else {
      fire();
    }
  }, [location, navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Grain noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-screen"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      <AmbientBackground />

      {/* TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-[44px] md:h-[56px] bg-[rgba(10,6,4,0.92)] backdrop-blur-md border-b border-[rgba(200,150,60,0.15)] z-50 flex items-center px-4 justify-between">
        <Link
          href="/"
          className="font-typewriter text-primary text-lg md:text-xl font-bold tracking-widest hover:opacity-80 transition-opacity"
        >
          VentWall
        </Link>

        <div className="flex items-center gap-3">
          {summary && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span>
                {summary.activePostCount} voices drifting through the wall
              </span>
            </div>
          )}
          <div className="hidden md:block">
            <AmbientControl />
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-[44px] md:pt-[56px] pb-[52px] md:pb-0 h-screen w-full relative z-10">
        {/* ── DESKTOP LEFT SIDEBAR ── */}
        <aside className="hidden md:flex w-[72px] fixed left-0 top-[56px] bottom-0 bg-[rgba(8,5,3,0.95)] flex-col items-center py-6 gap-2 z-40">
          {/* Primary nav — in requested order */}
          <SidebarItem
            href="/feed"
            icon={<LayoutGrid />}
            label="Wall"
            active={location === "/feed" || location === "/"}
          />
          <SidebarItem
            icon={<PenLine />}
            label="Write"
            onClick={handleWriteClick}
            highlight
          />
          <SidebarItem
            href="/feed?top=true"
            icon={<Flame />}
            label="Top Echoes"
            active={location === "/feed" && window.location.search.includes("top=true")}
          />
          <SidebarItem
            href="/my-echoes"
            icon={<Bookmark />}
            label="My Echoes"
            active={location === "/my-echoes"}
          />

          {/* Spacer pushes utility items to bottom */}
          <div className="flex-1" />

          <SidebarItem
            href="/safety"
            icon={<Shield />}
            label="Safety"
            active={location === "/safety"}
          />
          <SidebarItem
            href="/settings"
            icon={<Settings />}
            label="Settings"
            active={location === "/settings"}
          />

          {/* Visual separator before admin */}
          <div className="w-8 h-px bg-white/10 my-1" />

          <SidebarItem
            href="/admin"
            icon={<ShieldAlert />}
            label="Admin"
            active={location === "/admin"}
            muted
          />

          {/* Legal footer — only visible when sidebar is wide enough for labels */}
          <div className="hidden lg:block w-full px-3 pt-3 pb-1">
            <div className="border-t border-white/5 pt-3 space-y-1.5">
              <p className="text-[8px] font-mono text-muted-foreground/20 leading-relaxed text-center">
                Views are users' own.<br />Not VentWall's views.
              </p>
              <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                {[
                  { label: "Terms", href: "/terms" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Policy", href: "/content-policy" },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-[8px] font-mono text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        {/* Explicit height so children can resolve h-full: header=56px, mobile also has 56px bottom nav */}
        <main className="flex-1 md:ml-[72px] relative flex flex-col overflow-hidden pb-0 h-[calc(100dvh-96px)] md:h-[calc(100dvh-56px)]">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[52px] pb-safe bg-[rgba(10,6,4,0.97)] backdrop-blur-md border-t border-[rgba(60,46,32,0.6)] z-50 flex items-center justify-around px-2">
        <MobileNavItem
          href="/feed"
          icon={<LayoutGrid />}
          label="Wall"
          active={location === "/feed" || location === "/"}
        />
        <MobileNavItem
          icon={<PenLine />}
          label="Write"
          onClick={handleWriteClick}
          highlight
        />
        <MobileNavItem
          href="/safety"
          icon={<Shield />}
          label="Safety"
          active={location === "/safety"}
        />
        <MobileNavItem
          href="/settings"
          icon={<Settings />}
          label="Settings"
          active={location === "/settings"}
        />
      </nav>

      {/* ── MOBILE FAB — quick compose (hidden on feed page where composer is always visible) ── */}
      {!hideFab && <button
        onClick={handleWriteClick}
        className="md:hidden fixed bottom-[68px] right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_0_20px_-4px_rgba(212,144,10,0.8)]"
        style={{
          background: "linear-gradient(135deg, #d4900a 0%, #b47828 100%)",
          border: "1.5px solid rgba(212,144,10,0.5)",
        }}
        aria-label="Quick compose"
      >
        <PenLine className="w-5 h-5 text-white" />
      </button>}
    </div>
  );
}

// ── Sidebar item (desktop) ──
interface SidebarItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Amber glow accent — used for the Write action */
  highlight?: boolean;
  /** Dimmed appearance — used for Admin */
  muted?: boolean;
}

function SidebarItem({ href, icon, label, active, onClick, highlight, muted }: SidebarItemProps) {
  const colorClass = active
    ? "text-primary"
    : muted
    ? "text-muted-foreground/40 hover:text-muted-foreground"
    : "text-muted-foreground hover:text-foreground";

  const content = (
    <div
      className={`flex flex-col items-center gap-1.5 p-2 transition-all group relative w-full ${colorClass}`}
    >
      {/* Active indicator bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}

      {/* Icon */}
      <div
        className={`p-2 transition-all [&>svg]:w-5 [&>svg]:h-5 ${
          active
            ? "drop-shadow-[0_0_8px_var(--color-primary)]"
            : highlight
            ? "group-hover:drop-shadow-[0_0_8px_var(--color-primary)]"
            : ""
        }`}
      >
        {icon}
      </div>

      {/* Label — only on large screens */}
      <span className="text-[10px] font-mono text-center leading-tight tracking-wider hidden lg:block uppercase">
        {label}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full relative">
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className="w-full relative">
      {content}
    </Link>
  );
}

// ── Mobile nav item ──
interface MobileNavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  highlight?: boolean;
  muted?: boolean;
}

function MobileNavItem({ href, icon, label, active, onClick, muted }: MobileNavItemProps) {
  const colorClass = active
    ? "text-primary"
    : muted
    ? "text-muted-foreground/40"
    : "text-muted-foreground";

  const content = (
    <div className={`flex flex-col items-center gap-1 transition-all flex-1 py-2 ${colorClass}`}>
      <div
        className={`[&>svg]:w-5 [&>svg]:h-5 ${
          active ? "drop-shadow-[0_0_8px_var(--color-primary)]" : ""
        }`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex-1 h-full">
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className="flex-1 h-full">
      {content}
    </Link>
  );
}
