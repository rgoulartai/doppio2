// src/types/content.ts

export type Platform = 'youtube' | 'tiktok';
export type AITool = 'chatgpt' | 'claude' | 'perplexity';

export interface VideoCard {
  id: string;           // e.g., "l1c1", "l2c3", "l3c2"
  level: 1 | 2 | 3;
  card: 1 | 2 | 3;
  title: string;
  description: string;          // 1 sentence: what the video shows
  platform: Platform;
  videoId: string;              // YouTube video ID (11 chars) or TikTok numeric string
  thumbnailUrl?: string;        // Optional; if omitted, YouTube thumbnail auto-derived
  creator?: string;             // Channel / creator name shown in credits
  creatorUrl?: string;          // Link to creator's channel
  aiTool: AITool;               // Which AI tool the "Try it" button opens
  tryItPrompt: string;          // Natural language prompt (single sentence, action-first)
  tryItUrl: string;             // Full URL with ?q= pre-filled (URL-encoded)
  copyPrompt: string;           // Same as tryItPrompt — clipboard fallback text
}

export interface Level {
  level: 1 | 2 | 3;
  title: string;                // "Beginner", "Intermediate", "Advanced"
  emoji: string;                // "🌱", "⚡", "🚀"
  subtitle: string;             // Short description of the level
  aiToolLabel: string;          // "ChatGPT", "Claude", "Claude & Perplexity"
  cards: VideoCard[];
}

export interface Resource {
  title: string;
  url: string;
  description: string;          // 1 sentence about what this resource offers
  emoji: string;                // Visual anchor for the resource link
}

export interface DoppioContent {
  levels: Level[];
  resources: Resource[];        // Shown on the final completion screen (3–5 items)
}
