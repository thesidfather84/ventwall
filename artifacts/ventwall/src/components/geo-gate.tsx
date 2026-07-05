import { useEffect, useState } from "react";

const BASE_PATH = import.meta.env.BASE_URL ?? "/";

type GeoState = "loading" | "allowed" | "blocked";

export function GeoGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GeoState>("loading");

  useEffect(() => {
    fetch(`${BASE_PATH}api/geo`)
      .then((res) => res.json())
      .then((data: { allowed: boolean }) => {
        setState(data.allowed ? "allowed" : "blocked");
      })
      .catch(() => {
        setState("allowed");
      });
  }, []);

  if (state === "loading") {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "hsl(24 8% 5%)" }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: "rgba(212,144,10,0.4)" }}
        />
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "hsl(24 8% 5%)", color: "hsl(30 15% 65%)" }}
      >
        <div className="max-w-md space-y-6">
          <div
            style={{
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: "1.75rem",
              color: "hsl(43 80% 45%)",
              letterSpacing: "0.2em",
            }}
          >
            VentWall
          </div>
          <div
            style={{
              width: "4rem",
              height: "1px",
              background: "rgba(212,144,10,0.25)",
              margin: "0 auto",
            }}
          />
          <p
            style={{
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: "1.7",
              color: "hsl(30 15% 60%)",
            }}
          >
            VentWall is currently only available in the United States.
          </p>
          <p
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "hsl(30 10% 30%)",
            }}
          >
            Access restricted
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
