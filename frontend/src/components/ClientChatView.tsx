import { useState, useRef, useEffect, FC, FormEvent } from 'react';
import { Send, AlertTriangle, CheckCircle2, Package, Sparkles, User, Tag } from 'lucide-react';
import { ChatMessage } from '../types';

export const CUSTOMERS = [
  {
    id: 'usr_101',
    name: 'Ivan Z.',
    risk: 'High Risk (88%)',
    ltv: '$15k',
    scenario: 'Order #4501 • 2,000 UAH',
    desc: '4 tickets, 20 days inactive. High churn risk.',
  },
  {
    id: 'usr_102',
    name: 'Olena K.',
    risk: 'Low Risk (15%)',
    ltv: '$6.2k',
    scenario: 'Order #4502 • 850 UAH',
    desc: '1 ticket, recently active. Low churn risk.',
  },
  {
    id: 'usr_103',
    name: 'Taras M.',
    risk: 'VIP (45%)',
    ltv: '$24k',
    scenario: 'Order #4503 • 4,500 UAH',
    desc: 'Highest LTV, VIP status. Prefers instant resolution.',
  },
];

interface ClientChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  agentStatus: string;
  onSwitchToAdmin: (traceId?: number) => void;
  activeCustomerId: string;
  onCustomerChange: (id: string) => void;
}

const HARDCODED_CRISIS_PROMPT =
  "Your courier was a day late! The cheese is warm and the meat is spoiled! My party is ruined, give me my money back right now!";

export const ClientChatView: FC<ClientChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  agentStatus,
  onSwitchToAdmin,
  activeCustomerId,
  onCustomerChange,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeCustomer = CUSTOMERS.find((c) => c.id === activeCustomerId) || CUSTOMERS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    onSendMessage(msg);
  };

  const handlePresetClick = () => {
    setInput(HARDCODED_CRISIS_PROMPT);
  };

  return (
    <div className="max-w-3xl mx-auto my-6 bg-white rounded-3xl shadow-[0_12px_48px_rgba(92,74,66,0.12)] border border-brand-border/60 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Persona Selector Bar */}
      <div className="bg-brand-kraftDark/20 px-6 py-2 border-b border-brand-border flex items-center justify-between z-10 text-xs">
        <span className="font-bold text-brand-roasted/70 uppercase tracking-widest flex items-center space-x-2">
          <User className="w-3.5 h-3.5" />
          <span>Demo Persona</span>
        </span>
        <select
          value={activeCustomerId}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="bg-white border border-brand-border text-brand-roasted font-bold rounded-full px-3 py-1 outline-none focus:ring-1 focus:ring-brand-roasted cursor-pointer shadow-sm"
        >
          {CUSTOMERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} - {c.risk} ({c.ltv})
            </option>
          ))}
        </select>
      </div>

      {/* Soft Chat Header */}
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 border-b border-brand-border flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-brand-border shadow-sm">
                <img src="/ferma_logo.jpg" alt="Agent" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="font-serif font-bold text-brand-roasted flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-lg">
              <span>Підтримка Козацької Ферми</span>
            </h2>
          </div>
        </div>

        {/* Order Crisis Context Chip */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white border border-brand-border text-brand-roasted text-xs rounded-full shadow-sm font-bold">
          <Package className="w-4 h-4 text-brand-terracotta" />
          <span>{activeCustomer.scenario}</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-terracotta text-white text-[10px] uppercase font-extrabold tracking-wider shadow-sm">
            Simulated
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FFFCF8] relative">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjEiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')]"></div>

        <div className="relative z-10 space-y-4">
          {/* Intro context card */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start space-x-3 text-orange-950 text-xs shadow-sm">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1 font-sans">
              <p className="font-bold text-sm">Simulated Crisis Scenario: Problematic Order</p>
              <p className="font-medium opacity-90 text-sm">
                User <strong>{activeCustomer.name} ({activeCustomer.id})</strong>. {activeCustomer.desc}
              </p>
            </div>
          </div>

          {/* Message bubbles */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            
            // Prevent rendering an empty bubble before the stream delivers the first text token
            if (!isUser && !msg.text) return null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end space-x-2 max-w-[90%] sm:max-w-[80%]">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-border shadow-sm shrink-0 mb-1">
                       <img src="/ferma_logo.jpg" alt="KF" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div
                    className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm font-sans font-medium transition-all ${
                      isUser
                        ? 'bg-brand-green text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-brand-roasted border border-brand-border/60 rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line text-[15px]">{msg.text}</p>

                    {/* Resolution Badges on Agent Response */}
                    {!isUser && (msg.refunded || msg.voucher) && (
                      <div className="mt-3 pt-3 border-t border-brand-border/40 flex flex-wrap gap-2">
                        {msg.refunded && (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Refund Processed: Order #{msg.orderId || '4501'}</span>
                          </div>
                        )}

                        {msg.voucher && (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                            <span>Code: {msg.voucher}</span>
                          </div>
                        )}

                        <button
                          onClick={() => onSwitchToAdmin(msg.traceId)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-roasted text-white hover:bg-brand-roasted/90 rounded-full text-xs font-bold transition-all shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Inspect Trace &rarr;</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white border border-brand-green/20 shadow-sm shrink-0 mb-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-bold text-brand-roasted/60 mt-1 px-2">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {/* Realistic typing indicator */}
          {isLoading && (!messages.length || messages[messages.length - 1].sender === 'user' || !messages[messages.length - 1].text) && (
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-border shadow-sm shrink-0 mb-1">
                  <img src="/ferma_logo.jpg" alt="KF" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white border border-brand-border/60 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-roasted/60 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-brand-roasted/60 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-brand-roasted/60 animate-bounce"></span>
                <span className="ml-2 text-xs font-sans font-bold text-brand-roasted/80">
                  {agentStatus}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area & Quick Preset Bar */}
      <div className="p-4 bg-white border-t border-brand-border z-10 rounded-b-3xl">
        {/* Preset quick button for live university demonstration */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePresetClick}
            className="text-xs flex items-center space-x-1.5 text-brand-terracotta bg-white hover:bg-brand-terracotta/5 px-3 py-1.5 border border-brand-terracotta/40 rounded-full transition-all font-bold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Populate Crisis Prompt</span>
          </button>

          <span className="text-[10px] font-sans font-bold text-brand-roasted/80 uppercase tracking-wider">
            Simulated B2C Demo
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your message..."
            disabled={isLoading}
            className="flex-1 bg-[#FFFCF8] text-brand-roasted font-sans font-medium px-4 py-3 rounded-2xl border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 focus:outline-none placeholder:text-brand-roasted/50 transition-all shadow-sm"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[50px] px-6 rounded-2xl bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-white flex items-center justify-center font-bold transition-all shrink-0 shadow-sm"
          >
            <span className="mr-2">Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
