import { GoogleGenAI } from "@google/genai";
import { ImageGenerationConfig, WindowAI } from "../types";
import { FILTER_OPTIONS } from "../constants";

// Helper to access the global AI Studio object
const getWindowAI = (): WindowAI => window as unknown as WindowAI;

// Helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe accessor for API KEY
const getApiKey = (): string | undefined => {
    try {
        if (typeof process !== 'undefined' && process.env) {
            return process.env.API_KEY;
        }
    } catch (e) {
        return undefined;
    }
    return undefined;
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  const aiStudio = getWindowAI().aistudio;
  if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
    return await aiStudio.hasSelectedApiKey();
  }
  return false;
};

export const promptApiKeySelection = async (): Promise<void> => {
  const aiStudio = getWindowAI().aistudio;
  if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
    await aiStudio.openSelectKey();
  } else {
    console.warn("AI Studio API Key selection not available in this environment.");
  }
};

// Use a fast text model to enhance the prompt
export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key not found in environment variables.");
    
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `You are an expert prompt engineer for high-end AI image generators. Rewrite the following user prompt to be extremely descriptive, visual, and detailed to achieve a photorealistic result. Keep it under 100 words. Do not add conversational text, just the prompt. User Prompt: "${originalPrompt}"`,
        });
        return response.text?.trim() || originalPrompt;
    } catch (e) {
        console.error("Prompt enhancement failed", e);
        return originalPrompt;
    }
};

export const generateRealisticImage = async (config: ImageGenerationConfig): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key not found. Please ensure the 'API_KEY' environment variable is set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // --- Prompt Construction with Filters ---
  let promptParts = [config.prompt];

  if (!config.rawMode) {
      const getPrompt = (category: keyof typeof FILTER_OPTIONS, id?: string) => {
        if (!id || id === 'none') return '';
        return FILTER_OPTIONS[category].find(opt => opt.id === id)?.prompt || '';
      };

      const envPrompt = getPrompt('environment', config.environment);
      const charPrompt = getPrompt('character', config.character);
      const camPrompt = getPrompt('camera', config.camera);
      const moodPrompt = getPrompt('mood', config.mood);
      const techPrompt = getPrompt('technical', config.technicalStyle);
      const presetSuffix = config.stylePreset;

      if (techPrompt) promptParts.push(`Style: ${techPrompt}`);
      if (envPrompt) promptParts.push(`Environment: ${envPrompt}`);
      if (charPrompt) promptParts.push(`Subject Detail: ${charPrompt}`);
      if (camPrompt) promptParts.push(`Camera/Shot: ${camPrompt}`);
      if (moodPrompt) promptParts.push(`Mood/Atmosphere: ${moodPrompt}`);
      if (presetSuffix) promptParts.push(presetSuffix);
  } else {
      promptParts.push("High fidelity, raw, exact adherence to prompt.");
  }

  let finalPrompt = promptParts.join(", ");
  if (config.negativePrompt) {
      finalPrompt += ` --no ${config.negativePrompt}`;
  }

  // Prepare Content Parts
  let parts: any[] = [];
  let systemInstruction = "You are a world-class AI artist capable of generating hyper-realistic and stylistically complex imagery.";
  
  if (config.rawMode) {
      systemInstruction += " STRICTLY ADHERE to the user's prompt. Do not add unrequested elements.";
  } else {
      systemInstruction += " Pay close attention to lighting, composition, and texture. Enhance the visual quality.";
  }

  if (config.contentImage && config.styleImage) {
      parts.push({ inlineData: { mimeType: config.contentImage.mimeType, data: config.contentImage.data } });
      parts.push({ inlineData: { mimeType: config.styleImage.mimeType, data: config.styleImage.data } });
      const transferPrompt = "Instruction: Generate a new high-fidelity image that strictly preserves the structural content of the first image, but applies the artistic style of the second image.";
      const userAddon = config.prompt ? ` Additional User Instruction: ${config.prompt}` : "";
      parts.push({ text: transferPrompt + userAddon });
  } else {
      if (config.referenceImage) {
          parts.push({ inlineData: { mimeType: config.referenceImage.mimeType, data: config.referenceImage.data } });
          systemInstruction += " Use the provided image as a strong reference for composition, color, and subject matter.";
      }
      parts.push({ text: finalPrompt });
  }

  const handleResponse = (response: any) => {
    if (!response.candidates || response.candidates.length === 0) throw new Error("No candidates returned.");
    const content = response.candidates[0].content;
    if (!content.parts) throw new Error("No content parts returned.");
    for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in the response.");
  };

  const isHighQuality = config.resolution === '2K' || config.resolution === '4K';
  const primaryModel = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const imageConfig: any = { aspectRatio: config.aspectRatio };
  if (primaryModel === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = config.resolution;
  }

  const generationConfig: any = {
      systemInstruction,
      imageConfig,
      ...(config.seed !== undefined ? { seed: config.seed } : {}),
      ...(config.creativity !== undefined ? { temperature: config.creativity } : {})
  };

  // RETRY LOGIC for 429/Quota errors
  let retries = 0;
  const maxRetries = 3;

  while (true) {
    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: { parts },
            config: generationConfig,
        });
        return handleResponse(response);
    } catch (error: any) {
        const errStr = error.message || JSON.stringify(error);
        
        // Detect Quota/Rate Limit Errors
        const isQuotaError = error.status === 429 || 
                             errStr.includes("429") || 
                             errStr.includes("quota") || 
                             errStr.includes("RESOURCE_EXHAUSTED");

        if (isQuotaError && retries < maxRetries) {
            retries++;
            // Exponential backoff: 2s, 4s, 8s (plus small random jitter)
            const delay = Math.pow(2, retries) * 1000 + (Math.random() * 500);
            console.warn(`Quota limit hit. Retrying in ${Math.round(delay)}ms (Attempt ${retries}/${maxRetries})...`);
            await sleep(delay);
            continue;
        }

        // Clean up the error message for display
        let cleanMessage = "An unknown error occurred.";
        
        // 1. Try to parse JSON error message if it looks like one
        try {
            if (errStr.trim().startsWith('{')) {
                const parsed = JSON.parse(errStr);
                if (parsed.error && parsed.error.message) {
                    cleanMessage = parsed.error.message;
                } else if (parsed.message) {
                    cleanMessage = parsed.message;
                }
            } else {
                cleanMessage = errStr;
            }
        } catch(e) {
            cleanMessage = errStr;
        }

        // 2. Provide friendly message for Quota errors if retries failed
        if (isQuotaError) {
             console.error("Final Quota Error:", error);
             throw new Error("High Traffic: You exceeded the free tier rate limit. Please wait 1 minute before trying again.");
        }
        
        // 3. Handle Permission/Fallback errors
        const isPermissionError = error.status === 403 || errStr.includes("PERMISSION_DENIED");
        const isNotFoundError = error.status === 404 || errStr.includes("not found");

        if (primaryModel === 'gemini-3-pro-image-preview' && (isPermissionError || isNotFoundError)) {
             console.warn("Pro model failed, attempting fallback to Flash...");
             try {
                // Fallback attempt (Recursive but single level to avoid infinite loop logic complexity here)
                const { imageSize, ...fallbackImageConfig } = imageConfig;
                const fallbackResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts },
                    config: { ...generationConfig, imageConfig: fallbackImageConfig },
                });
                return handleResponse(fallbackResponse);
             } catch (fbError: any) {
                 throw new Error("Failed to generate image (Fallback also failed). Please check your API key permissions.");
             }
        }

        if (isPermissionError) {
            throw new Error("Permission Denied: Your API key cannot access this model. Ensure the Google Generative AI API is enabled in Cloud Console.");
        }

        throw new Error(cleanMessage);
    }
  }
};