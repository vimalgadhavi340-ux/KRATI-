import { GoogleGenAI } from "@google/genai";
import { ImageGenerationConfig, WindowAI } from "../types";
import { FILTER_OPTIONS } from "../constants";

// Helper to access the global AI Studio object
const getWindowAI = (): WindowAI => window as unknown as WindowAI;

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
    const apiKey = process.env.API_KEY;
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
  // Always instantiate new client to capture the latest env var
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure the 'API_KEY' environment variable is set in your deployment settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // --- Prompt Construction with Filters ---
  let promptParts = [config.prompt];

  // Only apply presets/filters if NOT in Raw Mode
  if (!config.rawMode) {
      // Helper to find prompt text from ID
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

      // Append detailed descriptions
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

  // Add negative prompt instruction if present
  if (config.negativePrompt) {
      finalPrompt += ` --no ${config.negativePrompt}`;
  }

  // Prepare Content Parts
  let parts: any[] = [];
  
  // System Instruction: Tailored for accuracy
  let systemInstruction = "You are a world-class AI artist capable of generating hyper-realistic and stylistically complex imagery.";
  
  if (config.rawMode) {
      systemInstruction += " STRICTLY ADHERE to the user's prompt. Do not add unrequested elements. Focus on composition and accuracy.";
  } else {
      systemInstruction += " Pay close attention to lighting, composition, and texture. Enhance the visual quality while respecting the subject.";
  }

  if (config.contentImage && config.styleImage) {
      // Style Transfer Mode (Image + Image + Text)
      parts.push({ 
          inlineData: { 
              mimeType: config.contentImage.mimeType, 
              data: config.contentImage.data 
          } 
      });
      parts.push({ 
          inlineData: { 
              mimeType: config.styleImage.mimeType, 
              data: config.styleImage.data 
          } 
      });
      
      const transferPrompt = "Instruction: Generate a new high-fidelity image that strictly preserves the structural content and composition of the first image (Content Image), but applies the artistic style, color palette, texture, and visual aesthetics of the second image (Style Image).";
      const userAddon = config.prompt ? ` Additional User Instruction: ${config.prompt}` : "";
      const negAddon = config.negativePrompt ? ` Exclude: ${config.negativePrompt}` : "";
      
      parts.push({ text: transferPrompt + userAddon + negAddon });
  } else {
      // Standard Text-to-Image Mode (Optional Image + Text)
      
      // Add Reference Image if present (Image-to-Image)
      if (config.referenceImage) {
          parts.push({
             inlineData: {
                 mimeType: config.referenceImage.mimeType,
                 data: config.referenceImage.data
             }
          });
          systemInstruction += " Use the provided image as a strong reference for composition, color, and subject matter.";
      }

      parts.push({ text: finalPrompt });
  }

  const handleResponse = (response: any) => {
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates returned from the model.");
    }
  
    const content = response.candidates[0].content;
    if (!content.parts) {
        throw new Error("No content parts returned.");
    }
  
    // Find the image part
    for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
    }
    throw new Error("No image data found in the response.");
  };

  // Determine Primary Model based on requested Resolution
  const isHighQuality = config.resolution === '2K' || config.resolution === '4K';
  const primaryModel = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Construct Config
  const imageConfig: any = {
      aspectRatio: config.aspectRatio,
  };

  // Only the Pro model supports specific image sizing parameters.
  if (primaryModel === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = config.resolution;
  }

  // Common Generation Config
  const generationConfig: any = {
      systemInstruction,
      imageConfig,
  };

  // Add Seed if provided
  if (config.seed !== undefined && config.seed !== null) {
      generationConfig.seed = config.seed;
  }
  
  // Map creativity (0-1) to temperature (0.0 - 2.0 range roughly for Gemini text, but usually 0-1 for stable generation)
  // For images, keeping it subtle. If not provided, default logic applies.
  if (config.creativity !== undefined) {
      generationConfig.temperature = config.creativity; 
  }

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: generationConfig,
    });
    return handleResponse(response);

  } catch (error: any) {
    // Check for Permission Denied (403) or Not Found (404)
    const isPermissionError = error.status === 403 || (error.message && error.message.includes("PERMISSION_DENIED"));
    const isNotFoundError = error.status === 404 || (error.message && error.message.includes("not found"));

    // If the PRO model failed due to permissions, fallback to the Standard model
    if (primaryModel === 'gemini-3-pro-image-preview' && (isPermissionError || isNotFoundError)) {
        console.warn("Gemini 3 Pro access denied. Falling back to Gemini 2.5 Flash Image.");
        
        // Remove unsupported config for fallback
        const { imageSize, ...fallbackImageConfig } = imageConfig;
        
        try {
          const fallbackResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts },
              config: {
                  systemInstruction, 
                  imageConfig: fallbackImageConfig,
                  ...(config.seed !== undefined ? { seed: config.seed } : {}),
                  ...(config.creativity !== undefined ? { temperature: config.creativity } : {})
              },
          });
          return handleResponse(fallbackResponse);
        } catch (fallbackError: any) {
           console.error("Fallback image generation failed:", fallbackError);
           if (fallbackError.status === 403 || (fallbackError.message && fallbackError.message.includes("PERMISSION_DENIED"))) {
              throw new Error("Permission denied. Please check if the 'Google Gemini API' is enabled in your Google Cloud Project.");
           }
           throw fallbackError;
        }
    }
    
    console.error("Image generation failed:", error);
    if (isPermissionError) {
        throw new Error("Permission denied. Your API key does not have access to this model. Please check your Google Cloud Console to ensure the API is enabled.");
    }
    throw error;
  }
};