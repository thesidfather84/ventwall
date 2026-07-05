import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import {
  ArrowLeft, Palette, Volume2, Bell, Shield, FileText, Lock,
  ExternalLink, Moon, Eye, Trash2,
} from "lucide-react";
import { useState } from "react";
import { useAmbientSound, AMBIENT_SRC } from "@/hooks/use-ambient-sound";

export default function Settings() {
  const [autoAnon, setAutoAnon] = useState(true);
  const { enabled: soundEnabled, toggle: toggleSound } = useAmbientSound(AMBIENT_SRC);
  const [reducedMotion, setReducedMotion] = useState(false);

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
          <span className="font-typewriter text-lg text-primary tracking-widest">Settings</span>
        </header>

        <div
          className="max-w-md mx-auto px-4 pt-6 pb-32 space-y-6"
          style={{ fontFamily: "'Special Elite', 'Courier New', monospace" }}
        >

          {/* ── Posting defaults ── */}
          <Section title="Posting Defaults">
            <SettingRow
              icon={<Eye className="w-4 h-4" />}
              label="Default to Anonymous"
              desc="New posts start anonymous by default."
            >
              <Switch
                checked={autoAnon}
                onCheckedChange={setAutoAnon}
                className="data-[state=checked]:bg-primary h-4 w-7 [&_span]:h-3 [&_span]:w-3 [&_span]:data-[state=checked]:translate-x-3"
              />
            </SettingRow>
          </Section>

          {/* ── Appearance ── */}
          <Section title="Appearance">
            <SettingRow
              icon={<Moon className="w-4 h-4" />}
              label="Reduce motion"
              desc="Fewer animations and transitions."
            >
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
                className="data-[state=checked]:bg-primary h-4 w-7 [&_span]:h-3 [&_span]:w-3 [&_span]:data-[state=checked]:translate-x-3"
              />
            </SettingRow>
            <SettingRow
              icon={<Palette className="w-4 h-4" />}
              label="Custom Wall Themes"
              desc="Choose your own candlelight palette."
              locked
            />
          </Section>

          {/* ── Sound ── */}
          <Section title="Sound">
            <SettingRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Cathedral of Ash"
              desc={soundEnabled ? "Ambient soundscape playing — soft and slow." : "Play ambient sound while reading the wall."}
            >
              <Switch
                checked={soundEnabled}
                onCheckedChange={toggleSound}
                className="data-[state=checked]:bg-primary h-4 w-7 [&_span]:h-3 [&_span]:w-3 [&_span]:data-[state=checked]:translate-x-3"
              />
            </SettingRow>
            <SettingRow
              icon={<Bell className="w-4 h-4" />}
              label="Echo Notifications"
              desc="Get notified when someone echoes your vent."
              locked
            />
          </Section>

          {/* ── Privacy ── */}
          <Section title="Privacy & Safety">
            <SettingRow
              icon={<Shield className="w-4 h-4" />}
              label="Safety Resources"
              desc="Crisis lines and support information."
              href="/safety"
            />
            <SettingRow
              icon={<Trash2 className="w-4 h-4" />}
              label="Clear my session data"
              desc="Removes any locally stored preferences."
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-mono rounded-sm border-white/10 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                }}
              >
                Clear
              </Button>
            </SettingRow>
          </Section>

          {/* ── About ── */}
          <Section title="About">
            <SettingRow
              icon={<FileText className="w-4 h-4" />}
              label="What is VentWall?"
              href="/what-is-ventwall"
            />
            <SettingRow
              icon={<Lock className="w-4 h-4" />}
              label="Terms of Use"
              href="/terms"
            />
            <SettingRow
              icon={<Lock className="w-4 h-4" />}
              label="Privacy Policy"
              href="/privacy"
            />
          </Section>

          {/* Version */}
          <p className="text-center text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest pt-2">
            VentWall · Real thoughts. Real people. No names.
          </p>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest px-1 pb-1">
        {title}
      </p>
      <div
        className="rounded-sm overflow-hidden divide-y divide-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  desc,
  children,
  locked,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  children?: React.ReactNode;
  locked?: boolean;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 bg-card/60 hover:bg-card/80 transition-colors">
      <div className={`shrink-0 ${locked ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-typewriter leading-tight ${
              locked ? "text-muted-foreground/40" : "text-foreground"
            }`}
          >
            {label}
          </span>
          {locked && (
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(212,144,10,0.08)",
                border: "1px solid rgba(212,144,10,0.2)",
                color: "rgba(212,144,10,0.6)",
              }}
            >
              Plus
            </span>
          )}
        </div>
        {desc && (
          <p className="text-xs font-serif italic text-muted-foreground/50 leading-tight mt-0.5">
            {desc}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
      {href && (
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <div>{inner}</div>;
}
