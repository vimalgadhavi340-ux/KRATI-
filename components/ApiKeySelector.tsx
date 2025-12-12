import React, { useState, useEffect } from 'react';
import { IconKey, IconSparkles, IconMail, IconArrowRight, IconSettings } from './Icons';
import { promptApiKeySelection } from '../services/geminiService';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  onUserNameSet: (name: string) => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, onUserNameSet }) => {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isGoogleEnv, setIsGoogleEnv] = useState(true);

  useEffect(() => {
    // Check if we are running in an environment that supports the secure key selector popup
    const aiStudio = (window as any).aistudio;
    if (!aiStudio || typeof aiStudio.openSelectKey !== 'function') {
        setIsGoogleEnv(false);
    }
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      await promptApiKeySelection();
      // Directly proceed to the app after the dialog closes.
      onKeySelected(); 
    } catch (err: any) {
      console.error("Key selection error:", err);
      // Handle the specific "Internal error" from the platform popup
      if (err.message && (err.message.includes("internal error") || err.message.includes("Requested entity was not found"))) {
        setError("Platform connection error. Please refresh the page and try again.");
      } else {
        setError("Failed to connect. Please refresh and try again.");
      }
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      const name = email.split('@')[0];
      // Capitalize first letter
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      onUserNameSet(formattedName);
      setEmailSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Abstract Flow Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-900/20 rounded-full blur-[100px] mix-blend-screen"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="glass-panel p-1 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-[#0a0a0a]/90 p-8 md:p-12 rounded-[22px] relative overflow-hidden">
            
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 mb-6 border border-white/10">
                <IconSparkles className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
              
              <h1 className="text-5xl font-display font-bold text-white tracking-tight mb-3">
                Krati<span className="text-indigo-500">.</span>ai
              </h1>
              <p className="text-gray-400 font-light text-lg">
                Generative imagery for the modern web.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center animate-in fade-in">
                {error}
              </div>
            )}

            <div className="space-y-6">
                {/* Email Input */}
                {!emailSubmitted ? (
                    <form onSubmit={handleEmailSubmit} className="relative group animate-in fade-in slide-in-from-bottom-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                            <IconMail className="w-5 h-5" />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email to start..."
                            className="w-full bg-[#18181b] border border-white/10 text-white pl-11 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all placeholder-gray-600 font-medium"
                            required
                        />
                         <button 
                            type="submit" 
                            disabled={!email.trim()} 
                            className="absolute right-2 top-2 bottom-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center"
                        >
                            <IconArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                ) : (
                    <div className="animate-in fade-in zoom-in-95">
                         <div className="bg-[#18181b]/50 border border-white/5 rounded-xl p-4 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div className="text-sm">
                                    <p className="text-gray-400 text-xs">Logged in as</p>
                                    <p className="text-white font-medium">{email}</p>
                                </div>
                            </div>
                            <button onClick={() => setEmailSubmitted(false)} className="text-xs text-gray-500 hover:text-white underline">Change</button>
                         </div>
                         
                         <div className="relative flex py-2 items-center mb-6">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-600 text-xs font-medium uppercase tracking-widest">Action Required</span>
                            <div className="flex-grow border-t border-white/5"></div>
                         </div>

                        {isGoogleEnv ? (
                            <>
                                <button
                                onClick={handleConnect}
                                className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-900/20"
                                >
                                <IconKey className="w-5 h-5" />
                                <span>Connect API Key</span>
                                </button>
                                <p className="text-center text-[10px] text-gray-500 mt-3">
                                    A valid Google Cloud API Key is required for image generation.
                                </p>
                            </>
                        ) : (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <IconSettings className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-amber-200 font-bold text-sm mb-2">Netlify Configuration Required</h3>
                                <div className="bg-black/30 rounded-lg p-3 text-[10px] text-left space-y-3 border border-amber-500/10 mb-3">
                                    <div className="space-y-1">
                                        <p className="font-bold text-amber-500">1. Go to Netlify Site Settings</p>
                                        <p className="text-gray-400">Navigate to: Site Configuration &gt; Environment variables</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-amber-500">2. Add Variable</p>
                                        <div className="grid grid-cols-[40px_1fr] gap-2 items-center">
                                            <span className="text-gray-500">Key:</span>
                                            <code className="bg-black p-1 rounded text-indigo-300">API_KEY</code>
                                            <span className="text-gray-500">Value:</span>
                                            <code className="bg-black p-1 rounded text-indigo-300">your_gemini_api_key</code>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-red-400">3. IMPORTANT: Redeploy</p>
                                        <p className="text-gray-400">You MUST trigger a new deployment (e.g., "Retry Deploy" in Deploys tab) for the new key to take effect.</p>
                                    </div>
                                </div>
                                <button onClick={() => window.location.reload()} className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-bold rounded-lg border border-amber-500/20 transition-colors">
                                    I have redeployed, Reload App
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {!emailSubmitted && (
                    <div className="text-center">
                         <button onClick={() => setEmailSubmitted(true)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                             Skip email step
                         </button>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">Powered by Gemini 3 Pro • Google Labs Style</p>
        </div>
      </div>
    </div>
  );
};