export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  feedback?: 'up' | 'down';
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageResolution = "1K" | "2K" | "4K";

export interface ImageGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  stylePreset?: string;
  // New Creative Filters
  environment?: string;
  character?: string;
  camera?: string;
  mood?: string;
  technicalStyle?: string;
  
  // Advanced Features
  seed?: number;
  creativity?: number; // 0.0 to 1.0
  rawMode?: boolean;   // If true, bypasses preset suffixes for exact prompt adherence
  
  referenceImage?: {
    data: string;
    mimeType: string;
  };
  
  contentImage?: {
    data: string; // Base64 string without prefix
    mimeType: string;
  };
  styleImage?: {
    data: string; // Base64 string without prefix
    mimeType: string;
  };
}

export interface WindowAI {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}