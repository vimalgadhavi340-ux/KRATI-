import { AspectRatio, ImageResolution } from "./types";

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "1:1", label: "Square", icon: "square" },
  { value: "16:9", label: "Landscape", icon: "landscape" },
  { value: "9:16", label: "Portrait", icon: "portrait" },
  { value: "4:3", label: "Classic", icon: "landscape-sm" },
  { value: "3:4", label: "Mobile", icon: "portrait-sm" },
];

export const RESOLUTIONS: ImageResolution[] = ["1K", "2K", "4K"];

export const STYLE_PRESETS = [
  { id: 'none', label: 'Raw / Natural', suffix: '' },
  { id: 'photorealistic', label: 'Photorealistic', suffix: ', highly detailed, 8k resolution, photorealistic, cinematic lighting, photography' },
  { id: 'cinematic', label: 'Cinematic', suffix: ', cinematic shot, movie scene, color graded, dramatic lighting, depth of field' },
  { id: 'studio', label: 'Studio Headshot', suffix: ', studio lighting, professional photography, bokeh, sharp focus' },
  { id: 'macro', label: 'Macro Nature', suffix: ', macro photography, extreme detail, soft focus background, organic textures' },
];

export const FILTER_OPTIONS = {
  environment: [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'studio', label: 'Studio Lighting', prompt: 'in a professional studio setting with 3-point lighting, clean backdrop' },
    { id: 'golden_hour', label: 'Golden Hour', prompt: 'during golden hour with warm, soft sunlight, outdoor setting' },
    { id: 'cyberpunk', label: 'Cyberpunk City', prompt: 'in a futuristic cyberpunk city with neon lights, rain-slicked streets, night time' },
    { id: 'deep_space', label: 'Deep Space', prompt: 'in deep space with nebulae, stars, and cosmic dust in the background' },
    { id: 'mystical_forest', label: 'Mystical Forest', prompt: 'in a dense, foggy forest with bioluminescent plants and ethereal atmosphere' },
    { id: 'luxury_interior', label: 'Luxury Interior', prompt: 'inside a modern luxury penthouse with floor-to-ceiling windows and architectural details' },
    { id: 'post_apoc', label: 'Post-Apocalyptic', prompt: 'in a gritty post-apocalyptic wasteland with ruins and overgrowth' },
  ],
  character: [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'candid', label: 'Candid Moment', prompt: 'caught in a candid moment, natural pose, unposed look' },
    { id: 'heroic', label: 'Heroic Pose', prompt: 'standing in a dynamic heroic pose, looking confident and powerful, low angle shot' },
    { id: 'silhouette', label: 'Silhouette', prompt: 'as a dramatic silhouette against a bright background, high contrast' },
    { id: 'double_exposure', label: 'Double Exposure', prompt: 'artistic double exposure effect blending the subject with nature elements' },
    { id: 'detailed_portrait', label: 'Detailed Portrait', prompt: 'extreme close-up portrait focusing on eyes and skin texture, pore-level detail' },
    { id: 'ethereal', label: 'Ethereal', prompt: 'glowing with an ethereal aura, floating hair, magical presence' },
  ],
  camera: [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'dslr', label: 'DSLR', prompt: 'shot on a high-end DSLR, sharp focus, 85mm lens, f/1.8 aperture' },
    { id: 'macro', label: 'Macro Lens', prompt: 'shot with a macro lens, extreme close-up, shallow depth of field, bokeh' },
    { id: 'wide', label: 'Wide Angle', prompt: 'shot with a wide-angle 16mm lens, expansive view, slight distortion' },
    { id: 'drone', label: 'Drone View', prompt: 'aerial view shot from a drone, high altitude, bird\'s eye perspective' },
    { id: 'polaroid', label: 'Polaroid', prompt: 'vintage polaroid style, soft focus, film grain, nostalgic color grading' },
    { id: 'fisheye', label: 'Fisheye', prompt: 'artistic fisheye lens effect, heavy distortion, circular framing' },
  ],
  mood: [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'cinematic', label: 'Cinematic', prompt: 'dramatic cinematic atmosphere, teal and orange color grading, movie-like' },
    { id: 'dreamy', label: 'Dreamy', prompt: 'soft, dreamy atmosphere, pastel colors, bloom effect, romantic' },
    { id: 'dark_gritty', label: 'Dark & Gritty', prompt: 'dark, gritty, noir-style atmosphere, high contrast, desaturated colors' },
    { id: 'vibrant', label: 'Vibrant', prompt: 'explosive vibrant colors, high saturation, energetic atmosphere' },
    { id: 'melancholic', label: 'Melancholic', prompt: 'sad, melancholic atmosphere, cool blue tones, rainy mood' },
    { id: 'euphoric', label: 'Euphoric', prompt: 'bright, euphoric atmosphere, god rays, uplifting lighting' },
  ],
  technical: [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'photoreal', label: 'Photorealistic', prompt: 'hyper-realistic photography, 8k resolution, raw photo' },
    { id: '3d_render', label: '3D Render', prompt: 'high-end 3D render, Octane render, Unreal Engine 5, ray tracing, global illumination' },
    { id: 'oil_painting', label: 'Oil Painting', prompt: 'classic oil painting style, visible brush strokes, textured canvas' },
    { id: 'anime', label: 'Anime/Manga', prompt: 'high quality anime art style, cel shading, vibrant colors, Studio Ghibli inspired' },
    { id: 'line_art', label: 'Line Art', prompt: 'minimalist line art, clean strokes, black and white, ink drawing' },
    { id: 'pixel_art', label: 'Pixel Art', prompt: 'retro 16-bit pixel art style, dithering, limited color palette' },
  ]
};

export const PROMPT_SUGGESTIONS = [
  {
    category: "Photorealistic",
    prompts: [
      "A close-up portrait of an elderly fisherman with deep wrinkles, wearing a yellow raincoat, stormy ocean background, cinematic lighting, 8k.",
      "A modern architectural glass house in a dense forest, morning mist, soft sunlight filtering through trees, hyper-realistic.",
      "A plate of gourmet sushi with water droplets, macro photography, depth of field, vibrant colors."
    ]
  },
  {
    category: "Sci-Fi",
    prompts: [
      "A cyberpunk street food vendor in Tokyo, neon signs reflecting in rain puddles, futuristic cyborg customers, highly detailed.",
      "An astronaut discovering a glowing crystal monolith on Mars, red dust swirling, dramatic shadows, digital art.",
      "A futuristic flying car city in the clouds, golden hour, utopia, intricate mechanical details."
    ]
  },
  {
    category: "Fantasy",
    prompts: [
      "A majestic dragon resting on a pile of gold in a dark cavern, glowing scales, smoke coming from nostrils, epic fantasy style.",
      "A magical library with floating books, spiral staircases, dust motes dancing in light beams, whimsical atmosphere.",
      "An elven warrior princess in silver armor, standing in a moonlit glade, magical forest background."
    ]
  },
  {
    category: "Abstract",
    prompts: [
      "A swirling vortex of liquid paint, gold and turquoise colors, fluid simulation, 3D render, abstract art.",
      "Geometric shapes made of crystal floating in a void, refraction of light, prismatic colors, minimalism."
    ]
  }
];