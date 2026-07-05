import { Volume2, VolumeX } from "lucide-react";
import { useAmbientSound, AMBIENT_SRC } from "@/hooks/use-ambient-sound";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AmbientControl() {
  const { enabled, toggle } = useAmbientSound(AMBIENT_SRC);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          aria-label={enabled ? "Mute ambient sound" : "Play ambient sound"}
          className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
            enabled
              ? "text-primary drop-shadow-[0_0_6px_var(--color-primary)]"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
        >
          {enabled ? (
            <Volume2 className="w-[15px] h-[15px]" />
          ) : (
            <VolumeX className="w-[15px] h-[15px]" />
          )}
          {/* Ripple ring when playing */}
          {enabled && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: "var(--color-primary)" }}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-mono">
        {enabled ? "Mute Cathedral of Ash" : "Play ambient sound"}
      </TooltipContent>
    </Tooltip>
  );
}
