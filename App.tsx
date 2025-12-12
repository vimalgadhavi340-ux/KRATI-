import React, { useState, useEffect } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { ImageGenerator } from './components/ImageGenerator';
import { LogoAnimation } from './components/LogoAnimation';
import { checkApiKeySelection } from './services/geminiService';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("Pro Creator");

  useEffect(() => {
    const checkKey = async () => {
      try {
        // 1. Check if the API Key is provided via Environment Variables (e.g., Vercel)
        if (process.env.API_KEY) {
          setHasApiKey(true);
          setLoading(false);
          return;
        }

        // 2. Fallback: Check for the Google IDX/AI Studio secure selection flow
        const selected = await checkApiKeySelection();
        setHasApiKey(selected);
      } catch (e) {
        console.error("Failed to check API key status", e);
      } finally {
        setLoading(false);
      }
    };
    checkKey();
  }, []);

  if (showSplash) {
      return <LogoAnimation onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {hasApiKey ? (
        <ImageGenerator initialUserName={userName} />
      ) : (
        <ApiKeySelector 
          onKeySelected={() => setHasApiKey(true)} 
          onUserNameSet={setUserName}
        />
      )}
    </>
  );
};

export default App;