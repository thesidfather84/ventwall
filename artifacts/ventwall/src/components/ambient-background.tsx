import { useEffect, useState } from "react";

// Ghost phrases that drift across the background (faint, barely readable)
const GHOST_PHRASES = [
  "I never told anyone...", "It still hurts.", "Why does nobody understand?",
  "I just needed to say it.", "Tomorrow will be different.", "I tried my best.",
  "Does anyone else feel this?", "I miss who I used to be.", "Nobody knows.",
  "This is the only place I'm honest.", "I'm not okay.", "I'll be okay.",
  "It's 2 AM and I can't stop thinking.", "Just needed to let that out.",
];

interface Particle { id: number; x: number; size: number; delay: number; duration: number; opacity: number; }
interface PaperScrap { id: number; x: number; delay: number; duration: number; rotate: number; w: number; h: number; }
interface GhostText { id: number; y: number; delay: number; duration: number; phrase: string; }

export function AmbientBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [papers, setPapers] = useState<PaperScrap[]>([]);
  const [ghosts, setGhosts] = useState<GhostText[]>([]);

  useEffect(() => {
    // Generate 30 dust particles
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 20,
      duration: Math.random() * 20 + 15,
      opacity: Math.random() * 0.4 + 0.1,
    })));
    // Generate 8 paper scraps
    setPapers(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      delay: Math.random() * 30,
      duration: Math.random() * 40 + 30,
      rotate: (Math.random() - 0.5) * 20,
      w: Math.random() * 40 + 20,
      h: Math.random() * 20 + 10,
    })));
    // Generate 6 ghost text phrases
    setGhosts(Array.from({ length: 6 }, (_, i) => ({
      id: i,
      y: Math.random() * 80 + 10,
      delay: Math.random() * 40,
      duration: Math.random() * 40 + 30,
      phrase: GHOST_PHRASES[Math.floor(Math.random() * GHOST_PHRASES.length)],
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,5,3,0.6) 100%)",
        }}
      />

      {/* Dust particles */}
      {particles.map(p => (
        <div
          key={`dust-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-4px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(200, 150, 60, ${p.opacity})`,
            animation: `floatDust ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}

      {/* Drifting paper scraps */}
      {papers.map(p => (
        <div
          key={`paper-${p.id}`}
          className="absolute"
          style={{
            left: `${p.x}%`,
            bottom: "-30px",
            width: `${p.w}px`,
            height: `${p.h}px`,
            background: "linear-gradient(135deg, #f4e4c1, #e8d5a3)",
            opacity: 0,
            borderRadius: "1px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `floatPaper ${p.duration}s ${p.delay}s infinite linear`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        />
      ))}

      {/* Ghost text phrases drifting left to right */}
      {ghosts.map(g => (
        <div
          key={`ghost-${g.id}`}
          className="absolute font-typewriter text-sm whitespace-nowrap"
          style={{
            top: `${g.y}%`,
            left: "-300px",
            color: "rgba(200, 165, 100, 0.08)",
            animation: `driftText ${g.duration}s ${g.delay}s infinite linear`,
            letterSpacing: "0.05em",
          }}
        >
          {g.phrase}
        </div>
      ))}
    </div>
  );
}
