import { Post, ReactionCounts, useAddEchoReaction, useReportPost } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { ECHO_REACTIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, MoreHorizontal, Ear, Waves, Users, Flame, Star, TrendingUp, Lamp, Keyboard, EyeOff, VolumeX } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey } from "@workspace/api-client-react";

const ADJECTIVES = ["Anonymous", "Silent", "Wandering", "Hollow", "Midnight", "Drifting", "Fading", "Lost", "Quiet", "Distant"];
const NOUNS = ["Lantern", "Page", "Voice", "Echo", "Ember", "Thought", "Shadow", "Letter", "Whisper", "Candle"];

function getAnonName(id: number) {
  return `${ADJECTIVES[id % ADJECTIVES.length]} ${NOUNS[Math.floor(id / ADJECTIVES.length) % NOUNS.length]}`;
}

function getHiddenPosts(): number[] {
  try { return JSON.parse(localStorage.getItem("vw-hidden-posts") || "[]"); } catch { return []; }
}
function getMutedNames(): string[] {
  try { return JSON.parse(localStorage.getItem("vw-muted-names") || "[]"); } catch { return []; }
}

const REACTION_ICONS: Record<string, any> = {
  heard: Ear,
  iFeelThat: Waves,
  sameWave: Waves,
  notAlone: Users,
  letItBurn: Flame,
  keepGoing: TrendingUp,
  neededThis: Star,
};

const EMOTION_STAMP_COLORS: Record<string, string> = {
  Angry: "text-[#8b0000] border-[#8b0000]/30",
  Sad: "text-[#00008b] border-[#00008b]/30",
  Happy: "text-[#b8860b] border-[#b8860b]/30",
  Stressed: "text-[#cd5c5c] border-[#cd5c5c]/30",
  Lonely: "text-[#4b0082] border-[#4b0082]/30",
  Celebration: "text-[#c71585] border-[#c71585]/30",
  "Random Thought": "text-[#2f4f4f] border-[#2f4f4f]/30",
  Confession: "text-[#483d8b] border-[#483d8b]/30",
  "Need Advice": "text-[#008b8b] border-[#008b8b]/30",
  "I'm Okay Now": "text-[#006400] border-[#006400]/30",
};

function totalReactions(counts: ReactionCounts) {
  return Object.values(counts).reduce((s, n) => s + (n as number), 0);
}

interface PostCardProps {
  post: Post;
  index?: number;
  decorative?: boolean;
  isNew?: boolean;
}

export function PostCard({ post, index = 0, decorative = false, isNew = false }: PostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addReaction = useAddEchoReaction();
  const reportPostMutation = useReportPost();

  const authorLabel = post.isAnonymous ? getAnonName(post.id) : (post.authorName ?? "Anonymous");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [isHidden, setIsHidden] = useState(() => getHiddenPosts().includes(post.id));
  const [isMuted, setIsMuted] = useState(() => getMutedNames().includes(authorLabel));

  const handleReaction = (reactionType: any) => {
    addReaction.mutate(
      { id: post.id, data: { reactionType } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() }) }
    );
  };

  const handleReport = () => {
    if (!reportReason) return;
    reportPostMutation.mutate(
      { id: post.id, data: { reason: reportReason } },
      {
        onSuccess: () => {
          setReportOpen(false);
          setReportReason("");
          toast({ title: "Report submitted", description: "Thank you for keeping VentWall safe." });
        },
      }
    );
  };

  const handleHide = () => {
    try {
      const hidden = getHiddenPosts();
      if (!hidden.includes(post.id)) {
        hidden.push(post.id);
        localStorage.setItem("vw-hidden-posts", JSON.stringify(hidden));
      }
    } catch {}
    setIsHidden(true);
    toast({ title: "Post hidden", description: "This post won't appear for you again this session." });
  };

  const handleMute = () => {
    try {
      const muted = getMutedNames();
      if (!muted.includes(authorLabel)) {
        muted.push(authorLabel);
        localStorage.setItem("vw-muted-names", JSON.stringify(muted));
      }
    } catch {}
    setIsMuted(true);
    toast({ title: "Voice muted", description: `Posts from ${authorLabel} are now hidden.` });
  };

  if (isHidden || isMuted) return null;

  const echoCount = totalReactions(post.reactionCounts);
  const isEchoed = echoCount >= 5;
  const stampColor = post.emotionTag
    ? EMOTION_STAMP_COLORS[post.emotionTag] ?? "text-[#3d2b1f] border-[#3d2b1f]/30"
    : "text-[#5a4530]/40 border-[#5a4530]/20";
  const tilt = index % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]";

  if (decorative) {
    return (
      <div
        className={`parchment rounded-sm p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative ${tilt}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 99% 100%, 1% 98%)" }}
      >
        <div className="flex items-start justify-between border-b border-[#3d2b1f]/10 pb-3">
          <div className="flex flex-col items-start gap-2">
            <Badge
              variant="outline"
              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-transparent border-dashed ${stampColor}`}
            >
              {post.emotionTag || "No Tag"}
            </Badge>
            <span className="text-sm text-parchment font-serif italic flex items-center gap-1.5 font-bold">
              {post.isAnonymous ? <Lamp className="w-3 h-3 opacity-70" /> : <Keyboard className="w-3 h-3 opacity-70" />}
              {authorLabel}
            </span>
          </div>
        </div>
        <p className="text-base text-parchment font-typewriter line-clamp-3">{post.content}</p>
      </div>
    );
  }

  return (
    <div
      className={`parchment rounded-sm p-5 md:p-8 space-y-6 relative group ${tilt} transition-transform hover:rotate-0 hover:z-10 xl:max-w-[105%] xl:-ml-2 ${
        isNew ? "post-card-new" : ""
      } ${isEchoed ? "post-card-echoed" : "shadow-[0_4px_20px_rgba(180,120,40,0.15)]"}`}
      style={{ clipPath: "polygon(0 0, 100% 0, 99% 100%, 1% 98%)" }}
    >
      <div className="flex items-start justify-between border-b border-[#3d2b1f]/10 pb-4">
        <div className="flex flex-col items-start gap-3">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-transparent border-dashed ${stampColor} ${!post.emotionTag ? "opacity-40" : ""}`}
          >
            {post.emotionTag || "No Tag"}
          </Badge>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-parchment font-serif italic flex items-center gap-1.5 font-bold">
              {post.isAnonymous ? <Lamp className="w-3.5 h-3.5 opacity-70" /> : <Keyboard className="w-3.5 h-3.5 opacity-70" />}
              {authorLabel}
            </span>
            <span className="text-[10px] text-parchment-muted font-mono uppercase tracking-wider">
              {formatDistanceToNow(new Date(post.expiresAt))} left
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEchoed && (
            <span className="text-[9px] font-mono text-amber-600/70 uppercase tracking-widest">
              {echoCount} echoes
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 text-parchment-muted hover:text-parchment hover:bg-[#3d2b1f]/5 rounded-sm"
              >
                <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-primary/20 bg-background/95 backdrop-blur-xl rounded-sm">
              <DropdownMenuItem
                onClick={handleHide}
                className="cursor-pointer font-serif italic rounded-none py-2.5 md:py-2 text-muted-foreground focus:text-foreground"
              >
                <EyeOff className="w-4 h-4 mr-2 opacity-70" /> Hide post
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleMute}
                className="cursor-pointer font-serif italic rounded-none py-2.5 md:py-2 text-muted-foreground focus:text-foreground"
              >
                <VolumeX className="w-4 h-4 mr-2 opacity-70" /> Mute this voice
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => setReportOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-serif italic rounded-none py-2.5 md:py-2"
              >
                <Flag className="w-4 h-4 mr-2" /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-base md:text-lg leading-relaxed text-parchment whitespace-pre-wrap font-typewriter">
        {post.content}
      </p>

      <div className="pt-4 flex flex-wrap gap-2 md:gap-2">
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
              className={`h-9 md:h-8 text-xs rounded-sm border-dashed ${
                count > 0
                  ? "bg-[#3d2b1f]/5 text-parchment border-[#3d2b1f]/30 font-bold"
                  : "text-parchment-muted border-transparent hover:border-[#3d2b1f]/20 hover:bg-transparent font-normal"
              } font-serif italic transition-all px-3`}
            >
              <Icon className={`w-3.5 h-3.5 md:w-3 md:h-3 mr-1.5 ${count > 0 ? "opacity-100" : "opacity-60"}`} />
              {count > 0 ? `${count} ${label}` : label}
            </Button>
          );
        })}
        {!showAllReactions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllReactions(true)}
            className="h-9 md:h-8 px-3 text-xs rounded-sm text-parchment-muted font-serif italic hover:bg-transparent hover:text-parchment"
          >
            + Echo
          </Button>
        )}
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-primary/20 bg-background sm:max-w-md rounded-sm w-[95vw] md:w-full">
          <DialogHeader>
            <DialogTitle className="font-typewriter text-primary">Report Vent</DialogTitle>
            <DialogDescription className="font-serif italic text-muted-foreground">
              Help us keep the wall safe. What's wrong with this vent?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setReportReason} value={reportReason}>
              <SelectTrigger className="font-mono rounded-sm border-white/10 bg-white/5 h-12 md:h-10">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-primary/20 bg-background">
                <SelectItem value="spam" className="font-mono text-xs rounded-none py-3 md:py-2">Spam or Self-Promotion</SelectItem>
                <SelectItem value="harassment" className="font-mono text-xs rounded-none py-3 md:py-2">Harassment or Bullying</SelectItem>
                <SelectItem value="hate_speech" className="font-mono text-xs rounded-none py-3 md:py-2">Hate Speech</SelectItem>
                <SelectItem value="self_harm" className="font-mono text-xs rounded-none py-3 md:py-2">Self-Harm or Suicide Intent</SelectItem>
                <SelectItem value="threat" className="font-mono text-xs rounded-none py-3 md:py-2">Threat of Violence</SelectItem>
                <SelectItem value="doxxing" className="font-mono text-xs rounded-none py-3 md:py-2">Doxxing or Personal Information</SelectItem>
                <SelectItem value="illegal" className="font-mono text-xs rounded-none py-3 md:py-2">Illegal Content</SelectItem>
                <SelectItem value="csam" className="font-mono text-xs rounded-none py-3 md:py-2">Child Exploitation</SelectItem>
                <SelectItem value="terrorism" className="font-mono text-xs rounded-none py-3 md:py-2">Terrorism or Extremism</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)} className="font-serif italic rounded-sm h-12 md:h-10">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={!reportReason || reportPostMutation.isPending}
              className="font-typewriter rounded-sm h-12 md:h-10"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
