import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export const MarketingCopilot: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [response]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/marketing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, user_id: 'marketer' })
      });
      
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error(error);
      setResponse(prev => prev + '\n\n[Connection Error]');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-brand-kraft text-brand-roasted p-6 font-sans">
      <div className="flex flex-col w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        
        {/* Header - Added flex-shrink-0 to prevent flex compression overlap */}
        <div className="px-6 py-4 bg-brand-roasted text-brand-kraft flex items-center gap-3 flex-shrink-0 z-10 shadow-sm relative">
          <span className="text-2xl">🌾</span>
          <div>
            <h2 className="font-bold text-lg tracking-wide uppercase">Marketing Co-Pilot</h2>
            <p className="text-sm opacity-80">TM "Kozatska Ferma"</p>
          </div>
        </div>

        {/* Output Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-brand-kraft/20">
          {!response && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-brand-roasted/50 text-center space-y-4">
              <span className="text-5xl opacity-50">✍️</span>
              <p className="max-w-md">
                I am your marketing assistant. Tell me what you want to create: an Instagram post, a Reels script, or a Midjourney food photography prompt.
              </p>
            </div>
          )}
          
          {response && (
            <div className="prose prose-stone max-w-none text-brand-roasted prose-headings:text-brand-roasted prose-strong:text-brand-roasted prose-p:leading-relaxed prose-pre:bg-brand-roasted prose-pre:text-brand-kraft">
              <ReactMarkdown>
                {response}
              </ReactMarkdown>
              <div ref={endRef} className="h-8" />
            </div>
          )}
          
          {loading && !response && (
            <div className="flex items-center gap-2 text-brand-roasted/70 p-4 font-medium animate-pulse">
              <span>Generating content in brand style</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-brand-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0">
          <form onSubmit={handleGenerate} className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt here... (e.g., Write a post about BBQ season)"
              className="flex-1 rounded-lg border-2 border-brand-border bg-white text-brand-roasted placeholder:text-brand-roasted/40 focus:bg-white focus:ring-0 focus:border-brand-roasted transition-colors p-3 shadow-sm font-medium"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-8 py-3 bg-brand-roasted hover:bg-brand-roasted/90 text-white font-bold tracking-wider uppercase text-sm rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
