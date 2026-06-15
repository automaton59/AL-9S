import React, { useState } from 'react';
import { ChatWindow } from './components/Chat/ChatWindow';
import { APISettings } from './components/Settings/APISettings';
import { useSettingsStore } from './stores/settings';

type Tab = 'chat' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { isConfigured } = useSettingsStore();

  // Show settings first if not configured
  React.useEffect(() => {
    if (!isConfigured) {
      setActiveTab('settings');
    }
  }, [isConfigured]);

  return (
    <div className="h-screen flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat
            {!isConfigured && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                Configure first
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          isConfigured ? (
            <ChatWindow />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Please configure your API settings first
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          )
        ) : (
          <APISettings />
        )}
      </div>
    </div>
  );
}

export default App;
