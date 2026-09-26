import { FC } from 'react';
import { MessageSquare, Terminal, RefreshCw, Network } from 'lucide-react';

interface NavbarProps {
  activeView: 'b2c' | 'admin' | 'a2a';
  setActiveView: (view: 'b2c' | 'admin' | 'a2a') => void;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
}

export const Navbar: FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onResetDemo,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-kraft/90 border-b border-brand-border transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-brand-border shadow-sm">
            <img src="/ferma_logo.jpg" alt="Козацька Ферма" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-xl tracking-tight text-brand-roasted">
                Козацька Ферма
              </span>
            </div>
            <p className="text-xs text-brand-roasted/80 font-sans font-medium hidden xl:block">
              100% Natural Meat & Whole Milk
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-white/60 rounded-full border border-brand-border overflow-x-auto mx-2 hide-scrollbar shadow-inner">
          <button
            onClick={() => setActiveView('b2c')}
            className={`flex items-center justify-center space-x-2 px-4 py-1.5 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
              activeView === 'b2c'
                ? 'bg-white text-brand-roasted shadow-sm border border-brand-border/40'
                : 'text-brand-roasted/80 hover:text-brand-roasted hover:bg-brand-roasted/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          <button
            onClick={() => setActiveView('admin')}
            className={`flex items-center justify-center space-x-2 px-4 py-1.5 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
              activeView === 'admin'
                ? 'bg-white text-brand-roasted shadow-sm border border-brand-border/40'
                : 'text-brand-roasted/80 hover:text-brand-roasted hover:bg-brand-roasted/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Trace Panel</span>
            {activeView !== 'admin' && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-terracotta opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-terracotta"></span>
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveView('a2a')}
            className={`flex items-center justify-center space-x-2 px-4 py-1.5 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
              activeView === 'a2a'
                ? 'bg-white text-brand-roasted shadow-sm border border-brand-border/40'
                : 'text-brand-roasted/80 hover:text-brand-roasted hover:bg-brand-roasted/5'
            }`}
          >
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">A2A Vision</span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono font-bold px-3 py-1.5 rounded-full border border-brand-border text-brand-roasted bg-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_4px_rgba(116,140,89,0.5)]"></span>
            <span>usr_101 (Ivan Z.)</span>
          </div>

          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset Order #4501 to delayed_critical for a fresh demo run"
            className="flex items-center justify-center space-x-1.5 text-xs font-bold px-4 py-1.5 rounded-full bg-white text-brand-terracotta hover:bg-brand-terracotta hover:text-white border border-brand-terracotta/40 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Reset Scenario</span>
          </button>
        </div>
      </div>
    </header>
  );
};
