import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListAdminPosts,
  useListAdminReports,
  useModeratePost,
  getListAdminPostsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  ArrowLeft, Flag, Trash, Shield, RefreshCw, LogOut, Search,
  AlertTriangle, Loader2, Eye, Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const SESSION_KEY = "vw-admin-authed";

// ---------- Password Gate ----------
function AdminPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "unconfigured">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data: { ok: boolean; configured: boolean } = await res.json();
      if (!data.configured) {
        setStatus("unconfigured");
        return;
      }
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        onUnlock();
      } else {
        setStatus("error");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <div
          className="w-full max-w-sm space-y-8"
          style={{ fontFamily: "'Special Elite', 'Courier New', monospace" }}
        >
          {/* Lock icon */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 30% 25%, #2a2018 0%, #0e0b07 100%)",
                border: "1px solid rgba(180,120,40,0.3)",
                boxShadow: "0 0 24px -8px rgba(212,144,10,0.4)",
              }}
            >
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-typewriter text-2xl text-primary tracking-widest uppercase text-center">
              Admin Void
            </h1>
            <p className="font-serif italic text-muted-foreground text-sm text-center">
              Speak the password to enter.
            </p>
          </div>

          {status === "unconfigured" ? (
            <div className="parchment rounded-sm p-6 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-mono text-sm text-[#3d2b1f]">Admin password not configured.</p>
              <p className="font-serif italic text-[#5a4530] text-xs">
                Set the <code className="font-mono">ADMIN_PASSWORD</code> secret in your environment to enable admin access.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="parchment rounded-sm p-4 space-y-4">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="Enter admin password..."
                  className="w-full bg-transparent font-typewriter text-[#3d2b1f] placeholder:text-[#3d2b1f]/30 placeholder:italic outline-none text-base border-b border-[#3d2b1f]/20 pb-2 focus:border-[#3d2b1f]/50 transition-colors"
                  autoComplete="current-password"
                />
                {status === "error" && (
                  <p className="text-red-600 text-xs font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Incorrect password.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!password || status === "loading"}
                className="w-full h-12 font-typewriter tracking-[0.15em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm border-b-4 border-[#b47828] active:border-b-0 active:translate-y-1 transition-all"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Enter the Void"
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link href="/feed" className="text-xs font-mono text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
              ← Back to the wall
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ---------- Admin Dashboard ----------
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showFlagged, setShowFlagged] = useState(false);

  const { data: posts, isLoading: postsLoading } = useListAdminPosts(
    { flagged: showFlagged || undefined },
    {
      query: {
        queryKey: getListAdminPostsQueryKey({ flagged: showFlagged || undefined }),
      },
    }
  );
  const { data: reports, isLoading: reportsLoading } = useListAdminReports({});
  const moderatePost = useModeratePost();

  const handleModerate = (id: number, action: "remove" | "flag" | "unflag" | "restore") => {
    moderatePost.mutate(
      { id, data: { action } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
        },
      }
    );
  };

  const filteredPosts = posts?.filter((p) => {
    if (!activeSearch) return true;
    return p.content.toLowerCase().includes(activeSearch.toLowerCase());
  });

  const flaggedCount = posts?.filter((p) => p.isFlagged && !p.isRemoved).length ?? 0;
  const reportedCount = reports?.length ?? 0;

  return (
    <Layout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/feed">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-typewriter text-lg tracking-widest text-primary">Admin Void</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-muted-foreground hover:text-destructive font-mono text-xs uppercase tracking-wider gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </Button>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        {[
          { label: "Total Posts", value: posts?.length ?? "—" },
          { label: "Flagged", value: flaggedCount },
          { label: "Reports", value: reportedCount },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 text-center">
            <div className="text-xl font-typewriter text-primary">{value}</div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 pb-32 overflow-y-auto">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-card border border-white/10 rounded-sm">
            <TabsTrigger value="posts" className="font-mono text-xs uppercase tracking-wider rounded-sm">
              Posts
              {flaggedCount > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[9px] flex items-center justify-center">
                  {flaggedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="font-mono text-xs uppercase tracking-wider rounded-sm">
              Reports
              {reportedCount > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-destructive/20 text-destructive text-[9px] flex items-center justify-center">
                  {reportedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Posts tab */}
          <TabsContent value="posts" className="space-y-4">
            {/* Search + filter */}
            <div className="flex gap-2">
              <form
                className="flex-1 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveSearch(searchQuery);
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="pl-9 h-9 text-xs font-mono bg-white/5 border-white/10 rounded-sm"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" className="rounded-sm border-white/10 font-mono text-xs h-9">
                  Search
                </Button>
              </form>
              <Button
                size="sm"
                variant={showFlagged ? "default" : "outline"}
                onClick={() => setShowFlagged((v) => !v)}
                className={`rounded-sm font-mono text-xs h-9 gap-1.5 ${showFlagged ? "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" : "border-white/10"}`}
              >
                <Flag className="w-3 h-3" />
                Flagged
              </Button>
            </div>

            {postsLoading ? (
              <div className="flex items-center justify-center p-12 text-primary">
                <Loader2 className="w-6 h-6 animate-spin opacity-50" />
              </div>
            ) : filteredPosts?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-serif italic">
                {activeSearch ? `No posts matching "${activeSearch}"` : "No posts found."}
              </div>
            ) : (
              filteredPosts?.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-sm border p-4 space-y-3 transition-opacity ${
                    post.isRemoved
                      ? "bg-destructive/5 border-destructive/20 opacity-50"
                      : post.isFlagged
                      ? "bg-orange-500/5 border-orange-500/20"
                      : "bg-card border-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal border-white/10 font-mono rounded-sm"
                        >
                          {post.emotionTag ?? "No Tag"}
                        </Badge>
                        {post.isRemoved && (
                          <Badge variant="destructive" className="text-[10px] rounded-sm">
                            Removed
                          </Badge>
                        )}
                        {post.isFlagged && !post.isRemoved && (
                          <Badge className="text-[10px] rounded-sm bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Flagged
                          </Badge>
                        )}
                        {post.reportCount > 0 && (
                          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 rounded-sm">
                            {post.reportCount} report{post.reportCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {post.id} · {formatDistanceToNow(new Date(post.createdAt))} ago
                        {post.isAnonymous ? " · Anonymous" : post.authorName ? ` · ${post.authorName}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {post.isRemoved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerate(post.id, "restore")}
                          disabled={moderatePost.isPending}
                          className="h-8 text-xs rounded-sm gap-1 border-white/10"
                        >
                          <RefreshCw className="w-3 h-3" /> Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleModerate(post.id, "remove")}
                          disabled={moderatePost.isPending}
                          className="h-8 text-xs rounded-sm gap-1"
                        >
                          <Trash className="w-3 h-3" /> Remove
                        </Button>
                      )}
                      {!post.isRemoved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerate(post.id, post.isFlagged ? "unflag" : "flag")}
                          disabled={moderatePost.isPending}
                          className={`h-8 text-xs rounded-sm gap-1 ${
                            post.isFlagged
                              ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              : "border-white/10"
                          }`}
                        >
                          <Flag className="w-3 h-3" />
                          {post.isFlagged ? "Unflag" : "Flag"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  {post.moderationNote && (
                    <p className="text-xs text-muted-foreground font-mono bg-white/5 rounded-sm px-2 py-1">
                      Note: {post.moderationNote}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Reports tab */}
          <TabsContent value="reports" className="space-y-4">
            {reportsLoading ? (
              <div className="flex items-center justify-center p-12 text-primary">
                <Loader2 className="w-6 h-6 animate-spin opacity-50" />
              </div>
            ) : reports?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-serif italic">
                No reports. The wall is behaving.
              </div>
            ) : (
              reports?.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-sm bg-card border border-white/5 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <Badge variant="destructive" className="text-xs rounded-sm font-mono">
                      {report.reason}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(report.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">Post ID: {report.postId}</p>
                  {report.details && (
                    <p className="text-sm text-muted-foreground italic">"{report.details}"</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-sm border-white/10 gap-1 h-8"
                    asChild
                  >
                    <Link href={`/admin`}>
                      <Eye className="w-3 h-3" /> View Post
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// ---------- Admin (auth gate wrapper) ----------
export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  const handleUnlock = () => setUnlocked(true);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  if (!unlocked) return <AdminPasswordGate onUnlock={handleUnlock} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
