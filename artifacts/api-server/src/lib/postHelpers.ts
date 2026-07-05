import type { Post } from "@workspace/db";
import type { Reaction } from "@workspace/db";

// Build the reaction counts object from a list of reaction rows
export function buildReactionCounts(reactions: Reaction[]) {
  const counts = {
    heard: 0,
    iFeelThat: 0,
    sameWave: 0,
    notAlone: 0,
    letItBurn: 0,
    keepGoing: 0,
    neededThis: 0,
  };

  for (const r of reactions) {
    const key = r.reactionType as keyof typeof counts;
    if (key in counts) {
      counts[key] += 1;
    }
  }

  return counts;
}

// Format a post for the public feed API response
export function buildPostResponse(
  post: Post,
  reactions: Reaction[],
  reportCount: number
) {
  return {
    id: post.id,
    content: post.content,
    emotionTag: post.emotionTag,
    authorName: post.authorName,
    isAnonymous: post.isAnonymous,
    expiresAt: post.expiresAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
    reactionCounts: buildReactionCounts(reactions),
    reportCount,
    isRemoved: post.isRemoved,
    isAiReflection: post.isAiReflection,
    isDailyPrompt: post.isDailyPrompt,
  };
}

// Format a post for the admin API response (includes extra moderation fields)
export function buildAdminPostResponse(
  post: Post,
  reactions: Reaction[],
  reportCount: number
) {
  return {
    ...buildPostResponse(post, reactions, reportCount),
    isFlagged: post.isFlagged,
    moderationNote: post.moderationNote,
  };
}
