export type Severity = "high" | "medium" | "low" | "none";
export type FlagType =
  | "none"
  | "selfHarm"
  | "threat"
  | "blocked"
  | "harassment"
  | "spam";

export interface ModerationResult {
  severity: Severity;
  flagType: FlagType;
  allowed: boolean;
  saveFlagged: boolean;
  message: string | null;
  detectedPattern: string;
}

// ── HIGH severity: immediate rejection ───────────────────────────────────────
// PII
const PII_PATTERNS: RegExp[] = [
  /\b(\d{3}[\s.\-]?\d{3}[\s.\-]?\d{4})\b/,
  /\b(\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard))\b/i,
  /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/,
  /\b(ssn|social security)\b.*\d{3}[\s\-]\d{2}[\s\-]\d{4}/i,
  /\b(?:\d{4}[\s\-]){3}\d{4}\b/,
];

// Prohibited content
const HIGH_PATTERNS: RegExp[] = [
  /\b(doxx|doxing|doxxing)\b/i,
  /\b(csam|child porn(ography)?|cp nude|jailbait)\b/i,
  /\b(revenge porn|non.?consensual (nude|porn|image)|leaked (nude|sex|tape))\b/i,
  /\b(how to (build|make|construct|create) (?:an? )?(?:bomb|pipe bomb|explosive device|ied|pressure cooker bomb|nail bomb|molotov))\b/i,
  /\b(bomb (threat|making)|school (shooting plan|attack plan)|mass (shooting plan|attack plan))\b/i,
  /\b(recruit(ing)? for (isis|al.?qaeda|taliban|terrorism))\b/i,
  /\b(how to (make|build|3d print) (?:an? )?(?:gun|firearm|untraceable weapon|ghost gun|silencer|suppressor))\b/i,
  /\b(sex (trafficking|slave)|human smuggling|buy (a girl|a boy|women|children) for sex)\b/i,
  /\b(download (this )?(keylogger|rat|trojan|malware|virus|ransomware))\b/i,
  /\b(phishing (kit|link)|steal (credit cards|bank accounts|passwords) tutorial)\b/i,
  // Self-harm INSTRUCTIONS (methods) — HIGH
  /\b(how to (kill|hang|overdose|cut) (my)?self|how to commit suicide|step[s]? to (kill|overdose))\b/i,
  /\b(best way to (die|kill myself|end it all|overdose))\b/i,
];

// Direct threats
const THREAT_PATTERNS: RegExp[] = [
  /\b(i (am|'m|will|gonna) (kill|murder|shoot|hurt|attack|harm|stab) (you|him|her|them|[a-z]+ [a-z]+))\b/i,
  /\b(going to (kill|murder|hurt) (you|him|her|them))\b/i,
  /\b(i know where you live)\b/i,
  /\b(i('ll| will) (shoot|bomb|blow up) (the |your )?(school|church|mosque|synagogue|mall|office|building))\b/i,
  /\b(shooting up|blowing up|burning down) (the |your )?(school|church|mosque|synagogue|mall|office)\b/i,
];

// Spam
const SPAM_PATTERNS: RegExp[] = [
  /(.)\1{9,}/,
];

const LINK_SPAM_PATTERN = /(https?:\/\/\S+)/gi;

// ── MEDIUM severity: save hidden for review ───────────────────────────────────
// Self-harm EXPRESSIONS (not instructions — those are HIGH)
const SELF_HARM_EXPRESSION_PATTERNS: RegExp[] = [
  /\b(kill myself|end my life|suicide|want to die|going to hurt myself|slit my wrists|overdose on|hang myself|jump off)\b/i,
  /\b(i (am|'m) going to (kill|hurt) myself)\b/i,
  /\b(don't want to (be here|live|exist) anymore)\b/i,
  /\b(cutting myself|self.?harm(ing)?|burn(ing)? myself)\b/i,
  /\b(i want to die|i want to end it|thinking about (ending|hurting) (it|myself))\b/i,
];

// Targeted harassment
const HARASSMENT_PATTERNS: RegExp[] = [
  /\b(you should (kill|hurt|die|hang) (your)?self)\b/i,
  /\b(i hope you (die|get (hurt|killed|cancer|raped))|go (kill|hang) yourself)\b/i,
  /\b(everyone hates you|you deserve to die|nobody wants you)\b/i,
];

// ── LOW severity: allow, no logging ──────────────────────────────────────────
// Profanity is allowed — VentWall is a free-expression platform

export function checkContent(content: string): ModerationResult {
  // ── Check PII first (HIGH) ──
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "high",
        flagType: "blocked",
        allowed: false,
        saveFlagged: false,
        message:
          "We can't publish this content. It appears to contain personal information (phone number, email, address, or financial data). Please remove it.",
        detectedPattern: "pii",
      };
    }
  }

  // ── Link spam (HIGH) ──
  const linkMatches = content.match(LINK_SPAM_PATTERN);
  if (linkMatches && linkMatches.length > 2) {
    return {
      severity: "high",
      flagType: "spam",
      allowed: false,
      saveFlagged: false,
      message:
        "Posts with multiple links are not allowed. VentWall is a space for expression, not promotion.",
      detectedPattern: "link_spam",
    };
  }

  // ── Character spam (HIGH) ──
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "high",
        flagType: "spam",
        allowed: false,
        saveFlagged: false,
        message: "Your post looks like spam. Try writing something genuine.",
        detectedPattern: "char_spam",
      };
    }
  }

  // ── Prohibited content (HIGH) ──
  for (const pattern of HIGH_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "high",
        flagType: "blocked",
        allowed: false,
        saveFlagged: false,
        message:
          "We can't publish this content. It may contain prohibited material including illegal instructions, personal information, or content that endangers others.",
        detectedPattern: "prohibited",
      };
    }
  }

  // ── Direct threats (HIGH) ──
  for (const pattern of THREAT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "high",
        flagType: "threat",
        allowed: false,
        saveFlagged: false,
        message:
          "We can't publish threats to harm another person. You can vent your anger here, but direct threats are not allowed.",
        detectedPattern: "threat",
      };
    }
  }

  // ── Self-harm expressions (MEDIUM) ──
  for (const pattern of SELF_HARM_EXPRESSION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "medium",
        flagType: "selfHarm",
        allowed: true,
        saveFlagged: true,
        message:
          "If you are in immediate danger or thinking about harming yourself, contact local emergency services or call/text 988 in the United States.",
        detectedPattern: "self_harm_expression",
      };
    }
  }

  // ── Targeted harassment (MEDIUM) ──
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        severity: "medium",
        flagType: "harassment",
        allowed: true,
        saveFlagged: true,
        message:
          "This post may contain targeted harassment and will be reviewed before appearing publicly.",
        detectedPattern: "harassment",
      };
    }
  }

  return {
    severity: "none",
    flagType: "none",
    allowed: true,
    saveFlagged: false,
    message: null,
    detectedPattern: "",
  };
}
