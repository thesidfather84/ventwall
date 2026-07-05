import { Post, ReactionCounts, useAddEchoReaction, getListPostsQueryKey, EchoInputReactionType } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { ECHO_REACTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Ear, Waves, Users, Flame, Star, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const REACTION_ICONS: Record<string, React.ElementType> = {
  heard: Ear,
  iFeelThat: Waves,
  sameWave: Waves,
  notAlone: Users,
  letItBurn: Flame,
  keepGoing: TrendingUp,
  neededThis: Star,
};

interface ReflectionCardProps {
  post: Post;
  index?: number;
  isNew?: boolean;
  onUseAsPrompt?: (text: string) => void;
}

export function ReflectionCard({ post, index = 0, isNew = false, onUseAsPrompt }: ReflectionCardProps) {
  const queryClient = useQueryClient();
  const addReaction = useAddEchoReaction();
  const [showAllReactions, setShowAllReactions] = useState(false);

  const tilt = index % 2 === 0 ? "rotate-[0.3deg]" : "-rotate-[0.3deg]";

  const handleReaction = (reactionType: string) => {
    addReaction.mutate(
      { id: post.id, data: { reactionType: reactionType as EchoInputReactionType } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() }) }
    );
  };

  const echoCount = Object.values(post.reactionCounts).reduce((s, n) => s + (n as number), 0);

  return (
    <div
      className={`relative rounded-sm p-5 md:p-8 space-y-5 group ${tilt} transition-transform hover:rotate-0 hover:z-10 ${
        isNew ? "post-card-new" : ""
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(220 15% 11%) 0%, hsl(240 12% 13%) 100%)",
        border: "1px solid hsl(240 20% 25% / 0.5)",
        clipPath: "polygon(0 0, 100% 0, 99% 100%, 1% 98%)",
        boxShadow: "0 4px 24px rgba(100, 80, 180, 0.12), inset 0 1px 0 rgba(160, 140, 220, 0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between border-b pb-4"
        style={{ borderColor: "hsl(240 20% 25% / 0.3)" }}
      >
        <div className="flex flex-col gap-2">
          {/* AI badge */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" style={{ color: "hsl(240 60% 70%)" }} />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{ color: "hsl(240 40% 60%)" }}
            >
              VentWall Reflection
            </span>
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "hsl(240 20% 45%)" }}
          >
            {formatDistanceToNow(new Date(post.expiresAt))} left
          </span>
        </div>
        <div className="flex items-center gap-2">
          {echoCount > 0 && (
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "hsl(240 30% 50%)" }}>
              {echoCount} echoes
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <p
        className="text-base md:text-lg leading-relaxed font-typewriter italic"
        style={{ color: "hsl(240 15% 80%)" }}
      >
        {post.content}
      </p>

      {/* Actions */}
      <div className="pt-2 flex flex-wrap gap-2 items-center">
        {ECHO_REACTIONS.map(({ label, value }) => {
          const count = post.reactionCounts[value as keyof ReactionCounts] as number;
          if (count === 0 && !showAllReactions) return null;
          const Icon = REACTION_ICONS[value] || Ear;
          return (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => handleReaction(value)}
              disabled={addReaction.isPending}
              className="h-9 md:h-8 text-xs rounded-sm border-dashed font-serif italic transition-all px-3"
              style={{
                background: count > 0 ? "hsl(240 20% 18%)" : "transparent",
                borderColor: count > 0 ? "hsl(240 20% 35%)" : "hsl(240 20% 25% / 0.4)",
                color: count > 0 ? "hsl(240 15% 75%)" : "hsl(240 15% 50%)",
              }}
            >
              <Icon className="w-3.5 h-3.5 md:w-3 md:h-3 mr-1.5 opacity-70" />
              {count > 0 ? `${count} ${label}` : label}
            </Button>
          );
        })}
        {!showAllReactions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllReactions(true)}
            className="h-9 md:h-8 px-3 text-xs rounded-sm font-serif italic hover:bg-transparent"
            style={{ color: "hsl(240 15% 45%)" }}
          >
            + Echo
          </Button>
        )}
        {onUseAsPrompt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUseAsPrompt(post.content)}
            className="h-9 md:h-8 px-3 text-xs rounded-sm font-mono ml-auto hover:bg-transparent"
            style={{ color: "hsl(240 40% 55%)" }}
          >
            ✍ Write from this
          </Button>
        )}
      </div>
    </div>
  );
}
