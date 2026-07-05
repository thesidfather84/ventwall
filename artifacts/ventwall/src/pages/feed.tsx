import { Layout } from "@/components/layout";
import { useListPosts, getListPostsQueryKey, Post } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard } from "@/components/post-card";
import { ReflectionCard } from "@/components/reflection-card";
import { Button } from "@/components/ui/button";
import { Loader2, Wind, Clock, Zap } from "lucide-react";
import { FEED_FILTERS } from "@/lib/constants";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { TypewriterComposer } from "@/components/typewriter-composer";
import { useReflectionScheduler } from "@/hooks/use-reflection-scheduler";

type SortMode = "liveDrift" | "newest" | "mostEchoed";

function totalEchoes(p: Post) {
  const c = p.reactionCounts;
  return c.heard + c.iFeelThat + c.sameWave + c.notAlone + c.letItBurn + c.keepGoing + c.neededThis;
}

// ---------- Live Drift hook ----------
function useLiveDrift(containerRef: React.RefObject<HTMLDivElement | null>, active: boolean) {
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const accumRef = useRef(0); // sub-pixel accumulator

  const pause = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  useEffect(() => {
    if (!active) return;

    let lastTs: number | null = null;
    // 6 px / second — very slow, paper-float feel
    const PX_PER_MS = 6 / 1000;

    const tick = (ts: number) => {
      if (lastTs !== null && !pausedRef.current) {
        const delta = ts - lastTs;
        accumRef.current += delta * PX_PER_MS;
        const whole = Math.floor(accumRef.current);
        if (whole > 0) {
          accumRef.current -= whole;
          const el = containerRef.current;
          if (el) {
            const max = el.scrollHeight - el.clientHeight;
            if (max > 0 && el.scrollTop < max) {
              el.scrollTop = Math.min(el.scrollTop + whole, max);
            }
          }
        }
      }
      lastTs = ts;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTs = null;
      accumRef.current = 0;
    };
  }, [active, containerRef]);

  // Touch: resume after 2 s of inactivity
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTouchStart = useCallback(() => {
    pause();
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, [pause]);
  const onTouchEnd = useCallback(() => {
    touchTimerRef.current = setTimeout(resume, 2000);
  }, [resume]);

  return { pause, resume, onTouchStart, onTouchEnd };
}

function dispatchPrefill(text: string) {
  window.dispatchEvent(new CustomEvent("vw:prefill-composer", { detail: text }));
}

export default function Feed() {
  useReflectionScheduler();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("liveDrift");

  const isNoTag = activeFilter === "noTag";
  const emotionTag = activeFilter && !isNoTag ? activeFilter : undefined;

  const { data: rawPosts, isLoading } = useListPosts(
    { emotionTag, noTag: isNoTag || undefined },
    {
      query: {
        queryKey: getListPostsQueryKey({ emotionTag, noTag: isNoTag || undefined }),
        refetchInterval: 20000,
      },
    }
  );

  // Track new post IDs so we can highlight them
  const prevIdsRef = useRef<Set<number>>(new Set());
  const newIds = useMemo(() => {
    if (!rawPosts) return new Set<number>();
    const ids = new Set<number>();
    for (const p of rawPosts) {
      if (!prevIdsRef.current.has(p.id)) ids.add(p.id);
    }
    return ids;
  }, [rawPosts]);
  useEffect(() => {
    if (rawPosts) prevIdsRef.current = new Set(rawPosts.map((p) => p.id));
  }, [rawPosts]);

  const posts = useMemo(() => {
    if (!rawPosts) return [];
    if (sortMode === "mostEchoed") {
      return [...rawPosts].sort((a, b) => totalEchoes(b) - totalEchoes(a));
    }
    // liveDrift and newest both show newest-first; drift is purely a scroll animation
    return rawPosts;
  }, [rawPosts, sortMode]);

  const decorativePosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].reverse().slice(0, 3);
  }, [posts]);

  // Drift
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDrifting = sortMode === "liveDrift";
  const { pause, resume, onTouchStart, onTouchEnd } = useLiveDrift(scrollContainerRef, isDrifting);

  // When new posts arrive in drift mode, scroll back to top so they're visible
  useEffect(() => {
    if (isDrifting && newIds.size > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [newIds, isDrifting]);

  const SORT_OPTIONS: { key: SortMode; label: string; icon: React.ReactNode }[] = [
    { key: "liveDrift", label: "Live Drift", icon: <Wind className="w-3 h-3" /> },
    { key: "newest", label: "Newest", icon: <Clock className="w-3 h-3" /> },
    { key: "mostEchoed", label: "Most Echoed", icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <Layout hideFab>
      {/* Grid: controls | scrollable-feed | composer */}
      <div className="w-full h-full relative" style={{ display: "grid", gridTemplateRows: "auto 1fr auto" }}>
        {/* Top control bar — desktop only; mobile shows posts immediately */}
        <div className="hidden md:block z-20 w-full bg-background/90 backdrop-blur-sm border-b border-white/5">
          {/* Sort mode row */}
          <div className="overflow-x-auto hide-scrollbar min-w-0 pt-1 pb-0.5 md:pt-2.5 md:pb-1 px-2 md:px-3">
            <div className="flex items-center justify-start md:justify-center gap-1">
              {SORT_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSortMode(key)}
                  className={`flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full font-mono text-[9px] md:text-[10px] uppercase tracking-wider transition-all border whitespace-nowrap ${
                    sortMode === key
                      ? "bg-primary/15 text-primary border-primary/40 shadow-[0_0_8px_-2px_var(--color-primary)]"
                      : "text-muted-foreground border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {icon}
                  {label}
                  {key === "liveDrift" && sortMode === "liveDrift" && (
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filter chips row — horizontal scroll on mobile */}
          <div className="overflow-x-auto hide-scrollbar min-w-0 py-1 md:py-1.5 md:pb-2.5 md:pt-1 px-2 md:px-4">
            <div className="flex gap-1 md:gap-1.5 md:flex-wrap md:justify-center">
              {FEED_FILTERS.map(({ label, value }) => {
                const filterKey = value ?? null;
                const isActive = activeFilter === filterKey;
                return (
                  <Button
                    key={label}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`shrink-0 rounded-sm h-6 md:h-7 text-[9px] md:text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap px-2 md:px-2.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-white/10 text-muted-foreground hover:text-white hover:border-white/30"
                    }`}
                    onClick={() => setActiveFilter(isActive ? null : filterKey)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feed scroll area — min-h-0 is required so flex-1 can actually shrink and overflow-y-auto activates */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto hide-scrollbar w-full relative"
          onMouseEnter={isDrifting ? pause : undefined}
          onMouseLeave={isDrifting ? resume : undefined}
          onTouchStart={isDrifting ? onTouchStart : undefined}
          onTouchEnd={isDrifting ? onTouchEnd : undefined}
        >
          <div className="max-w-[1400px] mx-auto w-full flex justify-center relative min-h-full pb-6">

            {/* Desktop XL: decorative left */}
            <div className="hidden xl:flex flex-col w-[300px] absolute left-4 top-20 space-y-24 pointer-events-none opacity-30 blur-[1px]">
              {decorativePosts.slice(0, 1).map((p) => (
                <div key={`dec-l-${p.id}`} className="scale-90 -rotate-2">
                  <PostCard post={p} decorative />
                </div>
              ))}
            </div>

            {/* Main column */}
            <div className="w-[95%] mx-auto md:w-full md:max-w-3xl md:px-6 md:py-6 lg:py-8 py-2 space-y-3 md:space-y-10">
              {isLoading ? (
                <div className="flex items-center justify-center p-12 text-primary">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
                      transition={{
                        duration: 0.6,
                        delay: newIds.has(post.id) ? 0 : Math.min(i * 0.04, 0.4),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {post.isAiReflection ? (
                        <ReflectionCard
                          post={post}
                          index={i}
                          isNew={newIds.has(post.id)}
                          onUseAsPrompt={dispatchPrefill}
                        />
                      ) : (
                        <PostCard post={post} index={i} isNew={newIds.has(post.id)} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {posts.length === 0 && !isLoading && (
                <div className="text-center p-12 text-muted-foreground space-y-2 font-serif italic">
                  <p>
                    {activeFilter === "noTag"
                      ? "No untagged posts right now."
                      : activeFilter
                      ? `No ${activeFilter} posts on the wall right now.`
                      : "The wall is quiet. Be the first voice."}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop XL: decorative right */}
            <div className="hidden xl:flex flex-col w-[300px] absolute right-4 top-40 space-y-24 pointer-events-none opacity-30 blur-[1px]">
              {decorativePosts.slice(1, 3).map((p) => (
                <div key={`dec-r-${p.id}`} className="scale-90 rotate-2">
                  <PostCard post={p} decorative />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Composer — natural flex child, always below the feed */}
        <TypewriterComposer />
      </div>
    </Layout>
  );
}
