import { useGetDailyPrompt } from "@workspace/api-client-react";
import { Feather } from "lucide-react";

interface DailyPromptBannerProps {
  onWrite: (prefill: string) => void;
}

export function DailyPromptBanner({ onWrite }: DailyPromptBannerProps) {
  const { data } = useGetDailyPrompt();

  if (!data?.prompt) return null;

  return (
    <div
      className="mx-4 mt-3 mb-1 rounded-sm px-4 py-3 cursor-pointer group transition-all hover:brightness-110 active:scale-[0.99]"
      style={{
        background: "linear-gradient(135deg, hsl(220 15% 10%) 0%, hsl(240 12% 12%) 100%)",
        border: "1px solid hsl(240 20% 22% / 0.6)",
        boxShadow: "0 2px 16px rgba(100, 80, 180, 0.08)",
      }}
      onClick={() => onWrite(`Today's Reflection: ${data.prompt}`)}
      role="button"
      aria-label="Use today's reflection prompt"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "hsl(240 30% 20%)" }}
        >
          <Feather className="w-3 h-3" style={{ color: "hsl(240 50% 65%)" }} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.2em]"
            style={{ color: "hsl(240 30% 50%)" }}
          >
            Today's Reflection
          </span>
          <p
            className="text-sm font-typewriter italic leading-snug"
            style={{ color: "hsl(240 10% 72%)" }}
          >
            {data.prompt}
          </p>
          <span
            className="text-[9px] font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(240 40% 55%)" }}
          >
            ✍ Click to write from this prompt
          </span>
        </div>
      </div>
    </div>
  );
}
