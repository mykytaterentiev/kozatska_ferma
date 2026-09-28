import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ClientChatView, CUSTOMERS } from './components/ClientChatView';
import { AdminTracePanel } from './components/AdminTracePanel';
import { A2AVision } from './components/A2AVision';
import { MarketingCopilot } from './components/MarketingCopilot';
import { ChatMessage } from './types';

export function App() {
  const [activeView, setActiveView] = useState<'b2c' | 'admin' | 'a2a' | 'marketing'>('b2c');
  const [activeCustomerId, setActiveCustomerId] = useState('usr_101');
  
  const getInitialMessage = (customerId: string) => {
    const customer = CUSTOMERS.find(c => c.id === customerId) || CUSTOMERS[0];
    const firstName = customer.name.split(' ')[0];
    return `Good afternoon, ${firstName}. Welcome to Kozatska Ferma Priority Support. How can I assist you with your orders today?`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text: getInitialMessage('usr_101'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState('Agent reasoning...');
  const [traceTrigger, setTraceTrigger] = useState(0);
  const [focusedTraceId, setFocusedTraceId] = useState<number | undefined>();
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCustomerChange = (customerId: string) => {
    setActiveCustomerId(customerId);
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'agent',
        text: getInitialMessage(customerId),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setAgentStatus('Agent reasoning...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user_id: activeCustomerId }),
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      if (!res.body) throw new Error('No body in response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      const agentMsgId = `agent-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: agentMsgId,
        sender: 'agent',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      let fullText = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          boundary = buffer.indexOf('\n');

          if (!line) continue;
          try {
              const data = JSON.parse(line);
              if (data.type === 'token') {
                 fullText += data.text;
                 setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, text: fullText } : m));
              } else if (data.type === 'status') {
                 setAgentStatus(data.text);
              } else if (data.type === 'metadata') {
                 setMessages(prev => prev.map(m => m.id === agentMsgId ? { 
                    ...m, 
                    orderId: data.order_id, 
                    traceId: data.trace_id,
                    refunded: fullText.includes('FERMA-RECOVER-20') || fullText.includes('FERMA-VIP-30'),
                    voucher: fullText.includes('FERMA-VIP-30') 
                              ? 'FERMA-VIP-30' 
                              : fullText.includes('FERMA-RECOVER-20') 
                                ? 'FERMA-RECOVER-20' 
                                : fullText.includes('FERMA-CARE-5')
                                  ? 'FERMA-CARE-5'
                                  : undefined
                 } : m));
                 setTraceTrigger(n => n + 1);
              }
           } catch (e) {
              console.warn('Failed to parse NDJSON line', line);
           }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const customer = CUSTOMERS.find(c => c.id === activeCustomerId) || CUSTOMERS[0];
      const firstName = customer.name.split(' ')[0];
      const fallbackMsg: ChatMessage = {
        id: `agent-fallback-${Date.now()}`,
        sender: 'agent',
        text: `${firstName}, I am truly sorry your party was ruined. Freshness is sacred to us, and the delay that compromised your order is completely unacceptable.\n\nI have immediately refunded your entire order back to your card. Additionally, I have credited your account with a 20% VIP voucher: **FERMA-RECOVER-20**.\n\nPlease accept our sincere apologies for letting you down today.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderId: 4501,
        refunded: true,
        voucher: 'FERMA-RECOVER-20',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setTraceTrigger((n) => n + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showNotification('Database successfully reset to delayed_critical');
        setMessages([
          {
            id: `init-${Date.now()}`,
            sender: 'agent',
            text: getInitialMessage(activeCustomerId),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setTraceTrigger((n) => n + 1);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (activeView === 'a2a') {
      return (
          <div className="min-h-screen bg-brand-kraft flex flex-col font-sans">
              <Navbar
                  activeView={activeView}
                  setActiveView={setActiveView}
                  onResetDemo={handleResetDemo}
                  isResetting={isResetting}
              />
              <main className="flex-1 w-full overflow-hidden">
                   <A2AVision />
              </main>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-brand-kraft text-brand-roasted flex flex-col font-sans transition-colors relative">
      {/* Texture Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')]"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar
            activeView={activeView}
            setActiveView={setActiveView}
            onResetDemo={handleResetDemo}
            isResetting={isResetting}
          />

          {/* Floating Notification */}
          {notification && (
            <div className="fixed top-20 right-6 z-50 bg-brand-green text-white px-4 py-2.5 rounded-2xl shadow-xl font-mono text-xs flex items-center space-x-2 animate-bounce">
              <span>{notification}</span>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeView === 'b2c' ? (
              <ClientChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                agentStatus={agentStatus}
                onSwitchToAdmin={(traceId) => {
                  setFocusedTraceId(traceId);
                  setActiveView('admin');
                }}
                activeCustomerId={activeCustomerId}
                onCustomerChange={handleCustomerChange}
              />
            ) : activeView === 'admin' ? (
              <AdminTracePanel onRefreshTrigger={traceTrigger} activeCustomerId={activeCustomerId} initialTraceId={focusedTraceId} />
            ) : activeView === 'marketing' ? (
              <MarketingCopilot />
            ) : null}
          </main>
      </div>
    </div>
  );
}

export default App;
