import { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import { EMOTION_TAGS } from "@/lib/constants";
import { useCreatePost, useCheckContent, getListPostsQueryKey, getGetFeedSummaryQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Mic, MicOff, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// emotionTag is optional — posts flow to the wall regardless of category
const postSchema = z.object({
  content: z.string().min(1, "Write something first.").max(1000, "Maximum 1000 characters."),
  emotionTag: z.string().optional(),
  isAnonymous: z.boolean(),
  authorName: z.string().optional(),
});

type PostFormState = {
  content: string;
  emotionTag: string;
  isAnonymous: boolean;
  authorName: string;
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export function TypewriterComposer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreatePost();
  const checkContent = useCheckContent();

  const [formState, setFormState] = useState<PostFormState>({
    content: "",
    emotionTag: "",
    isAnonymous: true,
    authorName: "",
  });
  const [contentError, setContentError] = useState<string | undefined>();
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingPostData, setPendingPostData] = useState<z.infer<typeof postSchema> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [composerGlow, setComposerGlow] = useState(false);
  // Ref always tracks latest state — no stale-closure issues in event handlers
  const stateRef = useRef(formState);
  stateRef.current = formState;

  // Listen for the "Write" sidebar button — focus textarea + pulse glow for 2s
  useEffect(() => {
    const handler = () => {
      textareaRef.current?.focus();
      setComposerGlow(true);
      setTimeout(() => setComposerGlow(false), 2000);
    };
    window.addEventListener("vw:focus-composer", handler);
    return () => window.removeEventListener("vw:focus-composer", handler);
  }, []);

  // Listen for prefill events from Daily Prompt banner or Reflection cards
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (!text) return;
      setFormState((prev) => ({ ...prev, content: text }));
      textareaRef.current?.focus();
      setComposerGlow(true);
      setTimeout(() => setComposerGlow(false), 2500);
    };
    window.addEventListener("vw:prefill-composer", handler);
    return () => window.removeEventListener("vw:prefill-composer", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isBusy = createPost.isPending || checkContent.isPending || isAnimating;
  const isEmpty = !formState.content.trim();

  // Auto-grow textarea on mobile
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !isMobile) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [formState.content, isMobile]);

  const setContent = (value: string) => {
    setFormState((prev) => ({ ...prev, content: value }));
    if (contentError) setContentError(undefined);
  };

  const setEmotionTag = (tag: string) => {
    setFormState((prev) => ({ ...prev, emotionTag: prev.emotionTag === tag ? "" : tag }));
  };

  const submitFinalPost = (data: z.infer<typeof postSchema>) => {
    createPost.mutate(
      { data: { ...data, emotionTag: data.emotionTag || undefined, authorName: data.isAnonymous ? undefined : data.authorName } },
      {
        onSuccess: () => {
          setIsAnimating(true);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
            toast({ title: "Dropped into the void." });
            setFormState({ content: "", emotionTag: "", isAnonymous: true, authorName: "" });
            setContentError(undefined);
            setIsAnimating(false);
          }, 600);
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          const msg = error?.response?.data?.error;
          if (status === 429) {
            toast({ title: "Slow down", description: "You're posting too quickly. Please wait a moment.", variant: "destructive" });
          } else if (status === 403) {
            toast({ title: "Posting restricted", description: "Repeated violations have temporarily restricted your ability to post.", variant: "destructive" });
          } else if (status === 422) {
            toast({ title: "Post Blocked", description: msg || "This content could not be published.", variant: "destructive" });
          } else {
            toast({ title: "Failed to post", description: "Something went wrong. Please try again.", variant: "destructive" });
          }
        },
      }
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Always read from ref to get the absolute latest state
    const current = stateRef.current;
    const data = {
      content: current.content.trim(),
      emotionTag: current.emotionTag || undefined,
      isAnonymous: current.isAnonymous,
      authorName: current.authorName || undefined,
    };

    const result = postSchema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setContentError(flat.content?.[0]);
      return;
    }

    setContentError(undefined);

    checkContent.mutate(
      { data: { content: data.content } },
      {
        onSuccess: (res) => {
          // HIGH severity — hard reject
          if (res.severity === "high") {
            toast({
              title: "Post Blocked",
              description: res.message || "This content violates our community guidelines.",
              variant: "destructive",
            });
            return;
          }
          // MEDIUM self-harm expression — show 988 crisis modal
          if (res.flagType === "selfHarm") {
            setPendingPostData(result.data);
            setSafetyModalOpen(true);
            return;
          }
          // All other content (LOW, NONE, or other MEDIUM) — submit
          // Server will save MEDIUM content as flagged/hidden for review
          submitFinalPost(result.data);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isMobile && !e.shiftKey) {
      e.preventDefault();
      if (!isEmpty && !isBusy) handleSubmit();
    }
  };

  const hasSpeechSupport =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleMic = useCallback(() => {
    if (!hasSpeechSupport) {
      toast({ title: "Not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const current = stateRef.current.content;
      setContent((current ? `${current} ${transcript}` : transcript).slice(0, 1000));
      textareaRef.current?.focus();
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Mic error", description: "Could not capture audio.", variant: "destructive" });
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, hasSpeechSupport, toast]);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col items-center relative transition-all duration-500 shrink-0"
      style={{
        background: "linear-gradient(180deg, #130d08 0%, #0c0806 100%)",
        borderTop: composerGlow
          ? "2px solid rgba(212,144,10,0.8)"
          : "2px solid #3a2e20",
        boxShadow: composerGlow
          ? "0 -8px 40px rgba(0,0,0,0.75), 0 -4px 30px -8px rgba(212,144,10,0.6)"
          : "0 -8px 40px rgba(0,0,0,0.75)",
      }}
    >
      <div
        className="w-full max-w-[760px] px-1 sm:px-6 pt-0.5 pb-1 sm:pt-2 sm:pb-3"
        style={{ fontFamily: "'Special Elite', 'Courier New', monospace" }}
      >
        {/* Paper feed slot — desktop only */}
        <div className="hidden sm:flex justify-center mb-1.5">
          <div
            className="w-3/4 h-2 rounded-b-lg"
            style={{ background: "#0a0604", border: "1px solid #2a221d", borderTop: "none" }}
          />
        </div>

        {/* Paper + Mic row */}
        <div className="relative w-full mx-auto z-10 flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
          <div className="flex-1">
            <div
              className={`parchment w-full rounded-t-sm shadow-[0_5px_15px_rgba(0,0,0,0.5)] px-4 pt-2.5 pb-8 md:pt-3 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom ${isAnimating ? "-translate-y-[200%] opacity-0" : "translate-y-0 opacity-100"}`}
              style={{ minHeight: isMobile ? "60px" : "90px" }}
            >
              {/* Paper lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 22px, #a08050 22px, #a08050 23px)",
                  backgroundPosition: "0 8px",
                }}
              />

              {/* Textarea — plain controlled, stable ref for latest value */}
              <textarea
                ref={textareaRef}
                value={formState.content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's weighing on you?"
                maxLength={1000}
                rows={isMobile ? 1 : 3}
                disabled={isBusy}
                className="relative w-full bg-transparent resize-none outline-none font-typewriter text-sm md:text-lg leading-[22px] md:leading-[24px] text-[#3d2b1f] placeholder:text-[#3d2b1f]/30 placeholder:italic placeholder:text-sm z-10"
                style={{ minHeight: isMobile ? "28px" : "44px", overflow: isMobile ? "hidden" : undefined }}
                aria-label="Vent text input"
                data-testid="vent-textarea"
              />

              {/* Character count */}
              <div className="absolute bottom-1.5 right-12 md:right-3 text-[9px] font-mono text-[#7a5c42] opacity-60 pointer-events-none">
                {formState.content.length}/1000
              </div>

              {/* Mobile sticky send */}
              <button
                type="submit"
                disabled={isEmpty || isBusy}
                className="md:hidden absolute bottom-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-95 disabled:opacity-30"
                style={{
                  background: isEmpty || isBusy ? "rgba(30,20,10,0.6)" : "linear-gradient(135deg, #d4900a, #b47828)",
                  boxShadow: isEmpty || isBusy ? "none" : "0 0 14px -2px rgba(212,144,10,0.7)",
                  border: "1px solid rgba(180,120,40,0.4)",
                }}
                aria-label="Send vent"
              >
                {isBusy ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Send className="w-3 h-3 text-white" />}
              </button>
            </div>

            {contentError && (
              <div className="text-destructive text-[10px] font-mono px-1 pt-1">{contentError}</div>
            )}
          </div>

          {/* Mic button — desktop only; mobile users use keyboard voice or the send button */}
          <div className="hidden sm:flex sm:flex-col items-center justify-center gap-1 self-center shrink-0 sm:pt-0">
            <button
              type="button"
              onClick={toggleMic}
              disabled={isBusy}
              aria-label={isListening ? "Stop recording" : "Speak your vent"}
              className={`relative flex flex-col items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-full transition-all active:translate-y-0.5 disabled:opacity-40 ${isListening ? "shadow-[0_0_18px_-2px_rgba(255,80,80,0.7)]" : "hover:scale-105"}`}
              style={{
                background: isListening
                  ? "radial-gradient(ellipse at 30% 25%, #4a1515 0%, #2a0808 100%)"
                  : "radial-gradient(ellipse at 30% 25%, #3a3028 0%, #1e1610 100%)",
                border: isListening ? "1px solid rgba(220,80,80,0.6)" : "1px solid #5a4530",
                boxShadow: isListening
                  ? "0 2px 0 #0a0806, 0 3px 5px rgba(0,0,0,0.5), 0 0 16px -3px rgba(220,60,60,0.5)"
                  : "0 2px 0 #0a0806, 0 3px 5px rgba(0,0,0,0.5)",
              }}
            >
              {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-amber-400/70" />}
              {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: "rgba(220,60,60,0.4)" }} />
              )}
            </button>
            <span className={`font-mono text-[8px] uppercase tracking-wider leading-tight text-center ${isListening ? "text-red-400" : "text-white/30"}`}>
              {isListening ? "stop" : "speak"}
            </span>
          </div>
        </div>

        {/* Emotion tags — optional — desktop only */}
        <div className="mt-1 mb-0.5 md:mt-2 md:mb-2 hidden md:flex flex-col md:items-center gap-1 md:gap-1.5 relative z-30">
          <div className="flex items-center justify-between md:justify-center w-full px-1 md:px-2">
            <span className="font-serif italic text-[9px] md:text-[10px] text-muted-foreground tracking-widest uppercase">
              Tag it (optional)
            </span>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar min-w-0 md:flex-wrap gap-1 md:gap-1.5 pb-0.5 md:pb-0 px-1 md:px-2 w-full md:justify-center">
            {EMOTION_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setEmotionTag(tag)}
                className={`shrink-0 px-2 py-0.5 rounded-full font-mono text-[9px] md:text-[10px] transition-all border leading-tight whitespace-nowrap ${
                  formState.emotionTag === tag
                    ? "bg-primary/20 text-primary border-primary/60 shadow-[0_0_8px_-2px_var(--color-primary)]"
                    : "bg-black/30 text-muted-foreground border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous toggle — desktop only */}
        <div className="hidden md:flex flex-row items-center justify-between md:justify-center gap-2 md:gap-3 mb-1.5 md:mb-3 relative z-30 w-full px-1 md:px-2 md:max-w-sm md:mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-[11px] text-muted-foreground tracking-widest uppercase">Post Anonymously</span>
            <Switch
              checked={formState.isAnonymous}
              onCheckedChange={(val) => setFormState((prev) => ({ ...prev, isAnonymous: val }))}
              className="data-[state=checked]:bg-primary h-4 w-7 [&_span]:h-3 [&_span]:w-3 [&_span]:data-[state=checked]:translate-x-3"
            />
          </div>
          {!formState.isAnonymous && (
            <Input
              value={formState.authorName}
              onChange={(e) => setFormState((prev) => ({ ...prev, authorName: e.target.value }))}
              placeholder="Your name..."
              className="h-7 text-xs font-mono bg-black/30 border-white/10 text-white w-32"
            />
          )}
        </div>

        {/* Decorative keyboard — desktop only */}
        <div className="max-w-xs mx-auto flex-col items-center gap-1 mb-3 opacity-20 pointer-events-none select-none hidden md:flex">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {row.map((key) => (
                <div
                  key={key}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(ellipse at 30% 25%, #3a3028 0%, #1e1610 100%)",
                    border: "1px solid #5a4530",
                    boxShadow: "0 2px 0 #0a0806, 0 3px 5px rgba(0,0,0,0.5)",
                  }}
                >
                  <span className="font-mono text-[8px] text-white/50">{key}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center gap-0.5 md:gap-1 relative z-30 w-full px-2 md:px-2">
          <Button
            type="submit"
            disabled={isBusy || isEmpty}
            data-testid="submit-button"
            className="w-full md:max-w-sm h-10 md:h-14 text-xs md:text-base font-typewriter tracking-tight md:tracking-[0.15em] uppercase overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)] rounded-sm border-b-2 md:border-b-4 border-[#b47828] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isBusy ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Throw It Into The Void"}
          </Button>
          <div className="flex flex-col items-center gap-0.5 mt-0.5 pb-0.5 md:pb-1">
            <span className="font-serif italic text-[9px] md:text-[10px] text-muted-foreground tracking-wider hidden md:block">
              Your vent will be live for 7 days
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/50 tracking-wide hidden md:block">
              Press Enter to throw it &middot; Shift + Enter for a new line
            </span>
          </div>
        </div>
      </div>

      {/* Safety Dialog */}
      <Dialog open={safetyModalOpen} onOpenChange={setSafetyModalOpen}>
        <DialogContent className="border-primary/20 bg-background sm:max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive font-typewriter">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Are you okay?
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4 text-base font-serif italic text-foreground">
              <p>We noticed your post might indicate you're going through a really dark time.</p>
              <div className="bg-destructive/10 p-4 rounded-sm border border-destructive/20 text-destructive-foreground">
                <p className="font-bold mb-2 not-italic font-sans">You don't have to face this alone.</p>
                <p className="not-italic font-sans">
                  Call or text <strong className="text-xl">988</strong> to reach the Suicide & Crisis Lifeline.
                </p>
                <p className="text-sm opacity-80 mt-2 font-sans">Available 24/7. Free. Confidential.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto font-serif italic rounded-sm border-white/10"
              onClick={() => setSafetyModalOpen(false)}
            >
              Cancel Post
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto text-muted-foreground font-serif italic rounded-sm hover:bg-white/5"
              onClick={() => {
                setSafetyModalOpen(false);
                if (pendingPostData) submitFinalPost(pendingPostData);
              }}
            >
              Continue posting anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
