import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ClientChatView } from './components/ClientChatView';
import { AdminTracePanel } from './components/AdminTracePanel';
import { A2AVision } from './components/A2AVision';
import { ChatMessage } from './types';

export function App() {
  const [activeView, setActiveView] = useState<'b2c' | 'admin' | 'a2a'>('b2c');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text: 'Good afternoon, Ivan. Welcome to Kozatska Ferma Priority Support. How can I assist you with your orders today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [traceTrigger, setTraceTrigger] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
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

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, user_id: 'usr_101' }),
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderId: data.order_id,
        refunded: true,
        voucher: 'FERMA-RECOVER-20',
      };

      setMessages((prev) => [...prev, agentMsg]);
      // Trigger trace panel update
      setTraceTrigger((n) => n + 1);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `agent-fallback-${Date.now()}`,
        sender: 'agent',
        text: 'Ivan, I am truly sorry your party was ruined. Freshness is sacred to us, and the delay that compromised your cheese and meat platter is completely unacceptable.\n\nI have immediately refunded your entire order of 2,000 UAH back to your card (Order #4501 is now processed as Refunded). Additionally, I have credited your account with a 20% VIP voucher: **FERMA-RECOVER-20**.\n\nPlease accept our sincere apologies for letting you down today.',
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
        showNotification('Order #4501 status successfully reset to delayed_critical');
        setMessages([
          {
            id: `init-${Date.now()}`,
            sender: 'agent',
            text: 'Good afternoon, Ivan. Welcome to Kozatska Ferma Priority Support. How can I assist you with your orders today?',
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
                onSwitchToAdmin={() => setActiveView('admin')}
              />
            ) : (
              <AdminTracePanel onRefreshTrigger={traceTrigger} />
            )}
          </main>
      </div>
    </div>
  );
}

export default App;
