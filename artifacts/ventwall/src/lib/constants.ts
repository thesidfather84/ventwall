export const EMOTION_TAGS = [
  "Angry",
  "Sad",
  "Happy",
  "Stressed",
  "Lonely",
  "Celebration",
  "Random Thought",
  "Confession",
  "Need Advice",
  "I'm Okay Now"
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

// Filter options for the feed — includes "All Voices" (no filter) and "No Tag"
export const FEED_FILTERS = [
  { label: "All Voices", value: null },
  { label: "Angry", value: "Angry" },
  { label: "Sad", value: "Sad" },
  { label: "Happy", value: "Happy" },
  { label: "Stressed", value: "Stressed" },
  { label: "Lonely", value: "Lonely" },
  { label: "Celebration", value: "Celebration" },
  { label: "Confession", value: "Confession" },
  { label: "Need Advice", value: "Need Advice" },
  { label: "Random", value: "Random Thought" },
  { label: "No Tag", value: "noTag" },
] as const;

export const ECHO_REACTIONS = [
  { value: "heard", label: "Heard" },
  { value: "iFeelThat", label: "I Feel That" },
  { value: "sameWave", label: "Same Wave" },
  { value: "notAlone", label: "Not Alone" },
  { value: "letItBurn", label: "Let It Burn" },
  { value: "keepGoing", label: "Keep Going" },
  { value: "neededThis", label: "Needed This" }
] as const;

export const EMOTION_COLORS: Record<string, string> = {
  "Angry": "text-red-500 border-red-500/20 bg-red-500/10",
  "Sad": "text-blue-400 border-blue-400/20 bg-blue-400/10",
  "Happy": "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
  "Stressed": "text-orange-500 border-orange-500/20 bg-orange-500/10",
  "Lonely": "text-indigo-400 border-indigo-400/20 bg-indigo-400/10",
  "Celebration": "text-pink-400 border-pink-400/20 bg-pink-400/10",
  "Random Thought": "text-gray-400 border-gray-400/20 bg-gray-400/10",
  "Confession": "text-purple-500 border-purple-500/20 bg-purple-500/10",
  "Need Advice": "text-cyan-400 border-cyan-400/20 bg-cyan-400/10",
  "I'm Okay Now": "text-green-400 border-green-400/20 bg-green-400/10"
};
