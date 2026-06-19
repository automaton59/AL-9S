import React, { useState } from 'react';
import { ChatWindow } from './components/Chat/ChatWindow';
import { SettingsPage, type SettingsSection } from './components/Settings/SettingsPage';
import { useSettingsStore } from './stores/settings';
import { applyThemeMode, watchSystemTheme } from './services/theme';

type Tab = 'chat' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('app');
  const { isConfigured, isHydrated, themeMode } = useSettingsStore();

  React.useEffect(() => {
    if (!isConfigured) {
      setActiveTab('settings');
      setSettingsSection('api');
    }
  }, [isConfigured]);

  React.useEffect(() => {
    const applyTheme = () => {
      applyThemeMode(themeMode);
    };

    applyTheme();
    return watchSystemTheme(themeMode, applyTheme);
  }, [themeMode]);

  const openSettingsSection = (section: SettingsSection) => {
    setSettingsSection(section);
    setActiveTab('settings');
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-rose-50 text-slate-950 transition-colors dark:bg-[#130d14] dark:text-rose-50">
      <div className="shrink-0 border-b border-white/70 bg-white/75 backdrop-blur dark:border-white/10 dark:bg-[#171018]/85">
        <div className="flex items-center justify-between px-3">
          <div className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-rose-500 text-rose-600 dark:border-rose-300 dark:text-rose-200'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-rose-100'
              }`}
            >
              聊天
              {!isConfigured && (
                <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-100">
                  未配置
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-rose-500 text-rose-600 dark:border-rose-300 dark:text-rose-200'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-rose-100'
              }`}
            >
              设置
            </button>
          </div>
          {!isHydrated && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
              正在读取本地数据
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          isConfigured ? (
            <ChatWindow onEditCharacter={() => openSettingsSection('characters')} />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#ffe4e6_0,#fff7ed_42%,#f8fafc_90%)] px-5 dark:bg-[radial-gradient(circle_at_top_left,#3a1728_0,#1b1018_42%,#0d1118_90%)]">
              <div className="text-center">
                <p className="mb-4 text-slate-600 dark:text-slate-300">
                  请先完成 API 设置
                </p>
                <button
                  onClick={() => openSettingsSection('api')}
                  className="rounded-full bg-rose-500 px-5 py-2 text-white shadow-sm shadow-rose-200 hover:bg-rose-600 dark:bg-rose-400 dark:text-[#1b1018] dark:shadow-none dark:hover:bg-rose-300"
                >
                  打开设置
                </button>
              </div>
            </div>
          )
        ) : (
          <SettingsPage activeSection={settingsSection} onSectionChange={setSettingsSection} />
        )}
      </div>
    </div>
  );
}

export default App;
