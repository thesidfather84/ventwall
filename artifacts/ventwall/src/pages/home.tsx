import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Flame, Lamp } from "lucide-react";
import { useGetFeedSummary, getGetFeedSummaryQueryKey, useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";

export default function Home() {
  const { data: summary } = useGetFeedSummary({
    query: {
      queryKey: getGetFeedSummaryQueryKey(),
      refetchInterval: 30000
    }
  });

  const { data: posts } = useListPosts(
    { limit: 3 },
    { 
      query: { 
        queryKey: getListPostsQueryKey({ limit: 3 }),
      } 
    }
  );

  return (
    <Layout>
      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 relative h-full min-h-[500px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4 w-full"
        >
          <h1 className="text-5xl font-bold font-typewriter text-primary tracking-widest drop-shadow-[0_0_30px_rgba(218,165,32,0.3)]">VentWall</h1>
          <p className="text-xl text-parchment font-serif italic leading-relaxed">
            The World's Anonymous Diary
          </p>
          {summary && (
            <p className="text-sm font-mono text-muted-foreground tracking-widest uppercase mt-4">
              {summary.activePostCount} voices drifting through the wall
            </p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-full space-y-4 flex flex-col items-center"
        >
          <Button asChild size="lg" className="w-full h-16 text-lg font-typewriter tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_-5px_var(--color-primary)] rounded-sm border-b-4 border-[#b47828] active:border-b-0 active:translate-y-1 transition-all">
            <Link href="/feed" data-testid="link-vent">
              <Flame className="mr-2 w-5 h-5" /> Vent Anonymously
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full h-16 text-lg font-serif italic rounded-sm border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
            <Link href="/feed" data-testid="link-join">
              <Lamp className="mr-2 w-5 h-5 opacity-70" /> Join VentWall
            </Link>
          </Button>
        </motion.div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="w-full flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60 absolute bottom-6"
        >
          <Link href="/what-is-ventwall" className="hover:text-primary transition-colors" data-testid="link-what-is">About</Link>
          <Link href="/safety" className="hover:text-primary transition-colors" data-testid="link-safety">Safety</Link>
          <Link href="/terms" className="hover:text-primary transition-colors" data-testid="link-terms">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy</Link>
        </motion.footer>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-1 w-full max-w-7xl mx-auto px-8 lg:px-16 items-center min-h-[calc(100vh-56px)]">
        {/* Left Side: Content */}
        <div className="w-1/2 flex flex-col justify-center space-y-12 pr-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h1 className="text-6xl lg:text-8xl font-bold font-typewriter text-primary tracking-widest drop-shadow-[0_0_30px_rgba(218,165,32,0.3)]">VentWall</h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6"></div>
            <p className="text-2xl lg:text-3xl text-parchment font-serif italic leading-relaxed max-w-lg">
              Real thoughts. Real people. No names.
            </p>
            {summary && (
              <p className="text-sm font-mono text-muted-foreground tracking-widest uppercase">
                {summary.activePostCount} voices drifting through the wall
              </p>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full space-y-5 max-w-sm"
          >
            <Button asChild size="lg" className="w-full h-16 text-lg font-typewriter tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_-5px_var(--color-primary)] rounded-sm border-b-4 border-[#b47828] active:border-b-0 active:translate-y-1 transition-all">
              <Link href="/feed" data-testid="link-vent">
                <Flame className="mr-2 w-5 h-5" /> Vent Anonymously
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full h-16 text-lg font-serif italic rounded-sm border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
              <Link href="/feed" data-testid="link-join">
                <Lamp className="mr-2 w-5 h-5 opacity-70" /> Join VentWall
              </Link>
            </Button>
          </motion.div>

          <motion.footer 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground opacity-60"
          >
            <Link href="/what-is-ventwall" className="hover:text-primary transition-colors" data-testid="link-what-is">What is VentWall?</Link>
            <Link href="/safety" className="hover:text-primary transition-colors" data-testid="link-safety">Safety Rules</Link>
          </motion.footer>
        </div>

        {/* Right Side: Live Wall Preview */}
        <div className="w-1/2 flex flex-col justify-center pl-8 gap-6">
          {posts?.slice(0, 3).map((post, i) => {
            const tilts = ["-rotate-[1deg]", "rotate-[1.5deg]", "-rotate-[0.5deg]"];
            const offsets = ["ml-0", "ml-6", "-ml-3"];
            return (
              <motion.div
                key={post.id}
                initial={{ x: 60 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                className={`${tilts[i % tilts.length]} ${offsets[i % offsets.length]} relative z-10`}
                style={{ animation: `cardDrift ${8 + i * 2}s ${i * 0.5}s infinite ease-in-out alternate` }}
              >
                <PostCard post={post} index={i} decorative={true} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
