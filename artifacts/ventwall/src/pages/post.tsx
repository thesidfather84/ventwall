import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EMOTION_TAGS } from "@/lib/constants";
import { useCreatePost, useCheckContent, getListPostsQueryKey, getGetFeedSummaryQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

const postSchema = z.object({
  content: z.string().min(1, "You must write something.").max(1000, "Maximum 1000 characters."),
  emotionTag: z.string({ required_error: "Please select an emotion." }),
  isAnonymous: z.boolean().default(true),
  authorName: z.string().optional(),
});

export default function PostComposer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createPost = useCreatePost();
  const checkContent = useCheckContent();
  
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingPostData, setPendingPostData] = useState<z.infer<typeof postSchema> | null>(null);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      emotionTag: "",
      isAnonymous: true,
      authorName: "",
    }
  });

  const isAnonymous = form.watch("isAnonymous");

  const submitFinalPost = (data: z.infer<typeof postSchema>) => {
    createPost.mutate(
      { data: { ...data, authorName: data.isAnonymous ? undefined : data.authorName } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFeedSummaryQueryKey() });
          toast({ title: "Dropped into the void." });
          setLocation("/feed");
        },
        onError: () => {
          toast({ title: "Failed to post", variant: "destructive" });
        }
      }
    );
  };

  const onSubmit = (data: z.infer<typeof postSchema>) => {
    checkContent.mutate(
      { data: { content: data.content } },
      {
        onSuccess: (result) => {
          if (result.flagType === "blocked") {
            toast({ 
              title: "Post Blocked", 
              description: result.message || "This content violates our safety guidelines.",
              variant: "destructive" 
            });
            return;
          }
          if (result.flagType === "selfHarm") {
            setPendingPostData(data);
            setSafetyModalOpen(true);
            return;
          }
          submitFinalPost(data);
        }
      }
    );
  };

  return (
    <Layout>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center">
        <Button asChild variant="ghost" size="icon" className="mr-2 rounded-full">
          <Link href="/feed"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <span className="font-medium text-lg">Drop a Truth</span>
      </header>

      <div className="p-4 flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="What's weighing on you right now?" 
                      className="min-h-[200px] text-lg resize-none bg-transparent border-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/50"
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {field.value.length}/1000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 bg-card p-4 rounded-xl border border-white/5">
              <FormField
                control={form.control}
                name="emotionTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">How does it feel?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Select an emotion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-background/95 backdrop-blur-xl">
                        {EMOTION_TAGS.map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-2">
                <FormLabel className="text-muted-foreground">Post Anonymously</FormLabel>
                <FormField
                  control={form.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  )}
                />
              </div>

              {!isAnonymous && (
                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem className="pt-2 animate-in fade-in slide-in-from-top-2">
                      <FormControl>
                        <Input placeholder="Enter a name or alias" className="bg-background/50 border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg rounded-full shadow-[0_0_20px_-5px_var(--color-primary)] font-medium"
              disabled={createPost.isPending || checkContent.isPending}
            >
              {(createPost.isPending || checkContent.isPending) ? <Loader2 className="w-6 h-6 animate-spin" /> : "Throw It Into The Void"}
            </Button>
          </form>
        </Form>
      </div>

      <Dialog open={safetyModalOpen} onOpenChange={setSafetyModalOpen}>
        <DialogContent className="border-white/10 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Are you okay?
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4 text-base">
              <p>We noticed your post might indicate you're going through a really dark time.</p>
              <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-destructive-foreground">
                <p className="font-semibold mb-2">You don't have to face this alone.</p>
                <p>Call or text <strong className="text-xl">988</strong> to reach the Suicide & Crisis Lifeline.</p>
                <p className="text-sm opacity-80 mt-2">Available 24/7. Free. Confidential.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSafetyModalOpen(false)}>
              Cancel Post
            </Button>
            <Button 
              variant="ghost" 
              className="w-full sm:w-auto text-muted-foreground"
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
    </Layout>
  );
}
