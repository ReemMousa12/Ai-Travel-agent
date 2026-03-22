import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageSquare, Briefcase, User, LogOut } from 'lucide-react';
import { auth } from './lib/auth';
import type { User as AuthUser } from './lib/auth';
import { cn } from './lib/utils';
import EnhancedChat from './components/EnhancedChat.tsx';
import Trips from './components/Trips.tsx';
import LandingPage from './components/LandingPage.tsx';
import Login from './components/Login';
import Profile from './components/Profile.tsx';

type Tab = 'home' | 'chat' | 'trips' | 'profile';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const currentUser = await auth.getUser();
    setUser(currentUser);
  }

  async function handleLogout() {
    await auth.signOut();
    setUser(null);
  }

  function handleNavigateToChat(message: string) {
    setInitialChatMessage(message);
    setActiveTab('chat');
    // Clear the message after a short delay to prevent re-triggering
    setTimeout(() => setInitialChatMessage(''), 1000);
  }

  if (!user) {
    return <Login onLogin={checkUser} />;
  }

  const tabs = [
    { id: 'home' as Tab, label: 'Home', icon: Home },
    { id: 'chat' as Tab, label: 'AI Agent', icon: MessageSquare },
    { id: 'trips' as Tab, label: 'My Trips', icon: Briefcase },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✈️</div>
              <h1 className="text-xl font-semibold text-gray-900">Tripto</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'home' ? (
          <LandingPage user={user} onNavigateToChat={handleNavigateToChat} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'chat' && <EnhancedChat user={user} initialMessage={initialChatMessage} />}
                {activeTab === 'trips' && <Trips user={user} />}
                {activeTab === 'profile' && <Profile user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

