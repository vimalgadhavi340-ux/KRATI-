import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, AspectRatio, ImageResolution } from '../types';
import { ASPECT_RATIOS, RESOLUTIONS, STYLE_PRESETS, PROMPT_SUGGESTIONS, FILTER_OPTIONS } from '../constants';
import { generateRealisticImage, enhancePrompt } from '../services/geminiService';
import { 
  IconDownload, IconSparkles, IconSquare, IconLandscape, IconPortrait, 
  IconWand, IconPalette, IconUpload, IconImage, IconX, IconMagic, IconSettings, IconLightbulb, IconPlus,
  IconThumbUp, IconThumbDown, IconFolderPlus, IconUser, IconDice, IconPen, IconCheck, IconRepeat
} from './Icons';

type GenMode = 'text' | 'style';

interface UploadedImage {
  data: string;
  mimeType: string;
  previewUrl: string;
}

interface ImageGeneratorProps {
  initialUserName?: string;
}

const AVATARS = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #ec4899, #f43f5e)",
  "linear-gradient(135deg, #10b981, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka", 
  "https://api.dicebear.com/9.x/notionists/svg?seed=Alexander",
  "https://api.dicebear.com/9.x/micah/svg?seed=Denise",
  "https://avatar.iran.liara.run/public/boy?username=Scott",
  "https://avatar.iran.liara.run/public/girl?username=Maria",
  "https://avatar.iran.liara.run/public/boy?username=Jason",
  "https://avatar.iran.liara.run/public/girl?username=Sophie"
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ initialUserName = "Pro Creator" }) => {
  const [mode, setMode] = useState<GenMode>('text');
  
  const [userName, setUserName] = useState(initialUserName);
  const [userAvatar, setUserAvatar] = useState(AVATARS[5]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempName, setTempName] = useState(initialUserName);
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [creativity, setCreativity] = useState<number>(0.8);
  const [rawMode, setRawMode] = useState<boolean>(false);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<ImageResolution>("1K");
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[1].id);

  const [environment, setEnvironment] = useState('none');
  const [character, setCharacter] = useState('none');
  const [camera, setCamera] = useState('none');
  const [mood, setMood] = useState('none');
  const [technicalStyle, setTechnicalStyle] = useState('none');
  
  const [contentImg, setContentImg] = useState<UploadedImage | null>(null);
  const [styleImg, setStyleImg] = useState<UploadedImage | null>(null);
  const [referenceImg, setReferenceImg] = useState<UploadedImage | null>(null); 

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  const handleEnhance = async () => {
      if (!prompt.trim()) return;
      setIsEnhancing(true);
      try {
          const enhanced = await enhancePrompt(prompt);
          setPrompt(enhanced);
      } catch (e) {
          console.error(e);
      } finally {
          setIsEnhancing(false);
      }
  };

  const handleNewProject = () => {
    setPrompt('');
    setNegativePrompt('');
    setSeed(undefined);
    setCreativity(0.8);
    setRawMode(false);
    setEnvironment('none');
    setCharacter('none');
    setCamera('none');
    setMood('none');
    setTechnicalStyle('none');
    setCurrentImage(null);
    setContentImg(null);
    setStyleImg(null);
    setReferenceImg(null);
    setError(null);
    setMode('text');
  };

  const handleRemix = (img: GeneratedImage) => {
    if (!img.url.startsWith('data:')) {
        console.warn("Remix currently only supports base64 images");
        return;
    }
    const [meta, data] = img.url.split(',');
    const mimeType = meta.split(':')[1].split(';')[0];
    
    setReferenceImg({ data, mimeType, previewUrl: img.url });
    setMode('text');
    setPrompt(img.prompt);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setHistory(prev => prev.map(img => {
        if (img.id === id) {
            return { ...img, feedback: img.feedback === type ? undefined : type };
        }
        return img;
    }));
    if (currentImage && currentImage.id === id) {
        setCurrentImage(prev => {
             if (!prev) return null;
             return { ...prev, feedback: prev.feedback === type ? undefined : type };
        });
    }
  };

  const handleGenerate = async () => {
    if (mode === 'text' && !prompt.trim() && !referenceImg) return;
    if (mode === 'style' && (!contentImg || !styleImg)) {
        setError("Please upload both Content and Style images.");
        return;
    }
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const remaining = 95 - prev;
        const increment = Math.max(0.2, remaining * 0.1 * Math.random());
        return Math.min(95, prev + increment);
      });
    }, 200);

    const selectedPreset = STYLE_PRESETS.find(p => p.id === stylePreset);
    const suffix = selectedPreset ? selectedPreset.suffix : '';

    try {
      const config: any = {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        aspectRatio,
        resolution,
        environment,
        character,
        camera,
        mood,
        technicalStyle,
        seed: seed,
        creativity,
        rawMode
      };

      if (mode === 'text') {
        config.stylePreset = suffix;
        if (referenceImg) {
            config.referenceImage = referenceImg;
        }
      } else {
        config.contentImage = contentImg;
        config.styleImage = styleImg;
      }

      const imageUrl = await generateRealisticImage(config);
      clearInterval(progressInterval);
      setProgress(100);

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: mode === 'style' ? `Style Transfer: ${prompt || 'Custom style'}` : prompt.trim(),
        timestamp: Date.now(),
        aspectRatio,
        resolution
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image.");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `krati-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'content' | 'style' | 'reference') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const [meta, base64] = result.split(',');
        const mime = meta.split(':')[1].split(';')[0];
        const imgObj = { data: base64, mimeType: mime, previewUrl: result };
        if (type === 'content') setContentImg(imgObj);
        else if (type === 'style') setStyleImg(imgObj);
        else if (type === 'reference') setReferenceImg(imgObj);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };

  const renderRatioIcon = (iconName: string, className: string) => {
    switch(iconName) {
        case 'square': return <IconSquare className={className} />;
        case 'landscape': return <IconLandscape className={className} />;
        case 'portrait': return <IconPortrait className={className} />;
        case 'landscape-sm': return <IconLandscape className={className} />;
        case 'portrait-sm': return <IconPortrait className={className} />;
        default: return <IconSquare className={className} />;
    }
  };

  const renderFilterCategory = (label: string, value: string, setValue: (v: string) => void, options: {id: string, label: string}[]) => (
    <div className="space-y-1 w-full">
        <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wider ml-1">{label}</label>
        <div className="relative group">
            <select 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={rawMode}
                className={`w-full appearance-none bg-[#0a0a0a] border rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 cursor-pointer transition-all ${rawMode ? 'border-white/5 opacity-40 cursor-not-allowed' : 'border-white/10 group-hover:border-white/20'}`}
            >
                {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${rawMode ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-400'}`}>
                <svg width="8" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
            </div>
        </div>
    </div>
  );

  const renderAvatarCircle = (avatar: string, sizeClass = "w-9 h-9", iconSizeClass = "w-5 h-5", isSelected = false) => {
      const isImage = avatar.startsWith('http');
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border transition-all relative ${isSelected ? 'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-white/10 shadow-sm'}`} style={{ background: !isImage ? avatar : undefined }}>
            {isImage ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <IconUser className={`${iconSizeClass} text-white`} />}
             {isSelected && <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center"><IconCheck className="w-5 h-5 text-white drop-shadow-md" /></div>}
        </div>
      );
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0a0a0a] h-full shrink-0 z-20">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-6">
             <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <IconSparkles className="w-4 h-4 text-white" />
             </div>
             <span className="font-display font-bold text-lg tracking-tight">Krati.ai</span>
          </div>
          
          <button onClick={handleNewProject} className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium transition-all flex items-center justify-center gap-2 group">
            <IconFolderPlus className="w-4 h-4 text-gray-400 group-hover:text-white" />
            <span className="group-hover:text-white text-gray-400">New Project</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2 px-2">Library</h3>
            {history.length === 0 ? (
                <div className="px-4 py-8 text-center border-2 border-dashed border-white/5 rounded-xl mx-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-2">
                        <IconImage className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-[10px] font-medium">No projects yet</p>
                </div>
            ) : (
                history.map(img => (
                    <button key={img.id} onClick={() => setCurrentImage(img)} className={`w-full text-left group p-2 rounded-lg flex items-center gap-3 transition-all ${currentImage?.id === img.id ? 'bg-[#18181b] border border-white/5' : 'hover:bg-white/5 border border-transparent'}`}>
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-black flex-shrink-0 border border-white/10">
                            <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-semibold truncate ${currentImage?.id === img.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{img.prompt}</p>
                            <p className="text-[9px] text-gray-600 mt-0.5">{new Date(img.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </button>
                ))
            )}
        </div>

        <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
             <div onClick={() => { setTempName(userName); setShowProfileModal(true); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                 {renderAvatarCircle(userAvatar, "w-8 h-8", "w-4 h-4")}
                 <div className="flex-1 min-w-0">
                     <p className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">{userName}</p>
                     <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Pro Plan</p>
                 </div>
                 <IconSettings className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
             </div>
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
           <div className="bg-[#18181b] border border-white/10 rounded-xl w-full max-w-sm p-5 shadow-2xl scale-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Edit Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-white"><IconX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-5">
                 <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Choose Avatar</label>
                    <div className="grid grid-cols-5 gap-2 justify-center">
                       {AVATARS.map((bg, idx) => (
                          <button key={idx} onClick={() => setUserAvatar(bg)} className="flex items-center justify-center hover:scale-105 transition-transform">
                             {renderAvatarCircle(bg, "w-10 h-10", "w-5 h-5", userAvatar === bg)}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Display Name</label>
                    <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                 </div>
                 <button onClick={() => { setUserName(tempName); setShowProfileModal(false); }} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Save Changes</button>
              </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-[#050505] overflow-y-auto scroll-smooth">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2 font-bold text-base font-display">
                <IconSparkles className="w-4 h-4 text-indigo-500" />
                Krati.ai
            </div>
            <div className="flex items-center gap-3">
                 <button onClick={() => setShowProfileModal(true)} className="md:hidden">{renderAvatarCircle(userAvatar, "w-7 h-7")}</button>
                <button onClick={handleNewProject} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"><IconPlus className="w-4 h-4" /></button>
            </div>
        </div>

        {/* Content Wrapper - Compact & Centered */}
        <div className="flex-1 flex flex-col items-center p-3 md:p-6 max-w-5xl mx-auto w-full gap-5 pb-24">
            <div className="w-full max-w-3xl space-y-4">
                {/* Tabs */}
                <div className="flex justify-center">
                    <div className="bg-[#121212] p-1 rounded-full border border-white/10 inline-flex shadow-xl shadow-black/20 scale-95 md:scale-100">
                        <button onClick={() => setMode('text')} className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${mode === 'text' ? 'bg-[#27272a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                            <IconWand className="w-3 h-3" /> Text Generation
                        </button>
                        <button onClick={() => setMode('style')} className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${mode === 'style' ? 'bg-[#27272a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                            <IconPalette className="w-3 h-3" /> Style Transfer
                        </button>
                    </div>
                </div>

                <div className="relative group rounded-3xl p-0.5 gradient-border-mask">
                    <div className="bg-[#0e0e0e] rounded-[22px] p-4 md:p-6 space-y-5 relative z-10">
                        {mode === 'style' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 ml-1">Structure Reference</label>
                                    <div className={`relative group aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${contentImg ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-[#27272a] hover:border-gray-600 bg-[#121212]'}`} onClick={() => !contentImg && contentInputRef.current?.click()}>
                                        <input type="file" ref={contentInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'content')} />
                                        {contentImg ? (
                                            <>
                                                <img src={contentImg.previewUrl} className="w-full h-full object-cover" alt="Content" />
                                                <button onClick={(e) => { e.stopPropagation(); setContentImg(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><IconX className="w-3.5 h-3.5" /></button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-1"><IconImage className="w-5 h-5 opacity-50" /><span className="text-[9px]">Upload Structure</span></div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 ml-1">Style Reference</label>
                                    <div className={`relative group aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${styleImg ? 'border-fuchsia-500/30 bg-fuchsia-500/5' : 'border-[#27272a] hover:border-gray-600 bg-[#121212]'}`} onClick={() => !styleImg && styleInputRef.current?.click()}>
                                        <input type="file" ref={styleInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'style')} />
                                        {styleImg ? (
                                            <>
                                                <img src={styleImg.previewUrl} className="w-full h-full object-cover" alt="Style" />
                                                <button onClick={(e) => { e.stopPropagation(); setStyleImg(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><IconX className="w-3.5 h-3.5" /></button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-1"><IconUpload className="w-5 h-5 opacity-50" /><span className="text-[9px]">Upload Style</span></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative bg-[#18181b] rounded-xl border border-white/5 focus-within:border-indigo-500/50 transition-colors p-3 md:p-4 shadow-inner">
                            <textarea ref={textareaRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'text' ? "Describe your imagination..." : "Add details (optional)..."} className="w-full bg-transparent border-0 focus:ring-0 text-sm md:text-base text-white placeholder-gray-600 resize-none min-h-[70px] leading-relaxed" rows={2} />
                            {mode === 'text' && referenceImg && (
                                <div className="mt-2 flex items-start gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10 w-fit">
                                     <div className="w-10 h-10 rounded-md overflow-hidden bg-black flex-shrink-0 relative group"><img src={referenceImg.previewUrl} className="w-full h-full object-cover opacity-80" alt="ref" /></div>
                                     <div className="flex flex-col h-10 justify-between py-0.5 pr-1">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ref</span>
                                        <button onClick={() => setReferenceImg(null)} className="text-[9px] text-red-400 hover:text-red-300 font-medium text-left flex items-center gap-0.5"><IconX className="w-2.5 h-2.5"/> Del</button>
                                     </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                <div className="flex gap-2">
                                     {mode === 'text' && (
                                        <>
                                            <input type="file" ref={referenceInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'reference')} />
                                            <button onClick={() => referenceInputRef.current?.click()} className={`text-[10px] md:text-xs font-medium transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 ${referenceImg ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-indigo-400'}`} title="Upload Reference Image">
                                                <IconImage className="w-3.5 h-3.5" /> <span>Ref Img</span>
                                            </button>
                                        </>
                                     )}
                                     <button onClick={() => setShowSuggestions(!showSuggestions)} className="text-[10px] md:text-xs font-medium text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                                        <IconLightbulb className="w-3.5 h-3.5" /> <span>Ideas</span>
                                     </button>
                                    <button onClick={() => setShowAdvanced(!showAdvanced)} className={`text-[10px] md:text-xs font-medium transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 ${showAdvanced ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-indigo-400'}`}>
                                        <IconSettings className="w-3.5 h-3.5" /> <span>Advanced</span>
                                    </button>
                                </div>
                                {mode === 'text' && (
                                    <button onClick={handleEnhance} disabled={!prompt.trim() || isEnhancing} className="text-[10px] md:text-xs font-bold gradient-text transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50">
                                        {isEnhancing ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <IconMagic className="w-3.5 h-3.5 text-indigo-400" />}
                                        <span>Enhance</span>
                                    </button>
                                )}
                            </div>
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl p-4 z-20 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspiration Gallery</span><button onClick={() => setShowSuggestions(false)}><IconX className="w-3.5 h-3.5 text-gray-500 hover:text-white" /></button></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">{PROMPT_SUGGESTIONS.map((category) => (<div key={category.category}><h4 className="text-[9px] font-bold text-indigo-400 mb-1.5 uppercase">{category.category}</h4><div className="space-y-1">{category.prompts.map((p, idx) => (<button key={idx} onClick={() => handleSuggestionSelect(p)} className="w-full text-left text-[10px] p-2 rounded-lg hover:bg-white/5 text-gray-300 transition-colors line-clamp-2 leading-relaxed bg-[#0a0a0a] border border-white/5">{p}</button>))}</div></div>))}</div>
                                </div>
                            )}
                        </div>

                        {mode === 'text' && (
                            <div className={`bg-[#18181b]/50 rounded-xl border border-white/5 p-3 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm transition-all duration-300 ${rawMode ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"><IconSparkles className="w-3 h-3" />Creative Controls</label>
                                     <button onClick={() => { setEnvironment('none'); setCharacter('none'); setCamera('none'); setMood('none'); setTechnicalStyle('none'); setSeed(undefined); }} className="text-[9px] text-gray-500 hover:text-white transition-colors">Reset</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                    {renderFilterCategory("Environment", environment, setEnvironment, FILTER_OPTIONS.environment)}
                                    {renderFilterCategory("Character", character, setCharacter, FILTER_OPTIONS.character)}
                                    {renderFilterCategory("Camera", camera, setCamera, FILTER_OPTIONS.camera)}
                                    {renderFilterCategory("Mood", mood, setMood, FILTER_OPTIONS.mood)}
                                    {renderFilterCategory("Technical", technicalStyle, setTechnicalStyle, FILTER_OPTIONS.technical)}
                                </div>
                            </div>
                        )}

                        {showAdvanced && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-[#18181b] p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2"><label className="text-[10px] font-semibold text-gray-400">Creativity / Freedom</label><span className="text-[10px] text-indigo-400 font-mono">{Math.round(creativity * 100)}%</span></div>
                                        <input type="range" min="0" max="1" step="0.1" value={creativity} onChange={(e) => setCreativity(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                        <div className="flex justify-between mt-1.5 text-[9px] text-gray-600 font-medium"><span>Strict</span><span>Balanced</span><span>Artistic</span></div>
                                    </div>
                                    <div className="bg-[#18181b] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div><label className="text-[10px] font-bold text-white block">Raw Mode</label><p className="text-[9px] text-gray-500 mt-0.5">Bypass styles for exact adherence</p></div>
                                        <button onClick={() => setRawMode(!rawMode)} className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 relative ${rawMode ? 'bg-indigo-600' : 'bg-gray-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${rawMode ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2 bg-[#18181b] p-3 rounded-xl border border-white/5">
                                        <label className="text-[10px] font-semibold text-gray-400 block mb-1.5">Negative Prompt</label>
                                        <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="blur, distortion, low quality..." className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:border-indigo-500/50 outline-none placeholder-gray-700" />
                                    </div>
                                    <div className="bg-[#18181b] p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-1.5"><label className="text-[10px] font-semibold text-gray-400 flex items-center gap-1"><IconDice className="w-3 h-3" /> Seed</label><button onClick={() => setSeed(Math.floor(Math.random() * 999999999))} className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold">RND</button></div>
                                        <input type="number" value={seed ?? ''} onChange={(e) => setSeed(parseInt(e.target.value) || undefined)} placeholder="Random" className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:border-indigo-500/50 outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-5 items-end md:items-center pt-1">
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <div className="flex gap-4 flex-wrap">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wider ml-1">Ratio</label>
                                        <div className="flex flex-wrap gap-1.5 bg-[#18181b] p-1 rounded-xl border border-white/5">
                                            {ASPECT_RATIOS.map(ratio => (
                                                <button key={ratio.value} onClick={() => setAspectRatio(ratio.value)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === ratio.value ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`} title={ratio.label}>
                                                    {renderRatioIcon(ratio.icon, "w-3 h-3")} <span>{ratio.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wider ml-1">Quality</label>
                                        <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5 h-full items-center">
                                            {RESOLUTIONS.map(res => (
                                                <button key={res} onClick={() => setResolution(res)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${resolution === res ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                                    {res}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={isGenerating || (mode === 'text' && !prompt.trim() && !referenceImg) || (mode === 'style' && (!contentImg || !styleImg))} className={`w-full md:w-auto min-w-[140px] h-[46px] rounded-full font-bold text-xs tracking-wide transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/30 ${isGenerating ? 'bg-[#18181b] border border-white/10 cursor-default' : (mode === 'text' && !prompt.trim() && !referenceImg) || (mode === 'style' && (!contentImg || !styleImg)) ? 'bg-[#18181b] text-gray-600 border border-white/5 cursor-not-allowed' : 'gradient-bg text-white hover:brightness-110'}`}>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center w-full px-4"><div className="flex items-center justify-between w-full text-[9px] text-gray-400 mb-0.5"><span>Generating</span><span>{Math.round(progress)}%</span></div><div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full gradient-bg transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div></div></div>
                                ) : ( <> <IconSparkles className="w-4 h-4" /> <span>GENERATE</span> </> )}
                            </button>
                        </div>
                    </div>
                </div>
                {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs text-center font-medium animate-in fade-in">{error}</div>}
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[300px]">
                {currentImage ? (
                    <div className="relative group w-full h-full flex items-center justify-center p-2 md:p-4">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className={`relative z-10 overflow-hidden shadow-2xl rounded-xl ring-1 ring-white/10 transition-all duration-700 ease-out animate-in fade-in zoom-in-95 ${currentImage.aspectRatio === '1:1' ? 'aspect-square max-h-[65vh]' : currentImage.aspectRatio === '16:9' ? 'aspect-video max-w-full' : currentImage.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[65vh]' : 'aspect-square max-h-[65vh]'}`}>
                            <img src={currentImage.url} alt={currentImage.prompt} className="w-full h-full object-contain bg-[#0a0a0a]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 md:p-6">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <p className="text-white/95 font-medium text-sm line-clamp-2 mb-3 drop-shadow-md leading-relaxed">{currentImage.prompt}</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex flex-1 gap-2">
                                            <button onClick={() => handleDownload(currentImage)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-full text-[10px] font-bold hover:bg-gray-200 transition-colors shadow-lg"><IconDownload className="w-3.5 h-3.5" /> Download {currentImage.resolution}</button>
                                            <button onClick={() => handleRemix(currentImage)} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors border border-white/10" title="Remix"><IconRepeat className="w-3.5 h-3.5" /> Remix</button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleFeedback(currentImage.id, 'up')} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${currentImage.feedback === 'up' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`}><IconThumbUp className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleFeedback(currentImage.id, 'down')} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${currentImage.feedback === 'down' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`}><IconThumbDown className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-700 space-y-4 opacity-60 animate-in fade-in zoom-in duration-700">
                         <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                            <div className="relative w-20 h-20 mx-auto border border-white/10 rounded-2xl flex items-center justify-center bg-[#0a0a0a] shadow-xl"><IconLandscape className="w-8 h-8 text-gray-600" /></div>
                         </div>
                        <div><p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Canvas Ready</p><p className="text-[10px] text-gray-600 mt-1">Start by describing your vision above</p></div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};