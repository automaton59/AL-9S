import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import type { ThemeMode } from '../../services/interfaces';

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  Icon: typeof Monitor;
}> = [
  {
    value: 'system',
    label: '跟随系统',
    description: '随操作系统自动切换。',
    Icon: Monitor,
  },
  {
    value: 'light',
    label: '浅色',
    description: '明亮、柔和的聊天空间。',
    Icon: Sun,
  },
  {
    value: 'dark',
    label: '深色',
    description: '低亮度的夜间聊天空间。',
    Icon: Moon,
  },
];

export function AppSettings() {
  const { themeMode, setThemeMode } = useSettingsStore();

  return (
    <section className="space-y-5 rounded-2xl border border-rose-100 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171018]/80 dark:shadow-none">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-rose-50">应用设置</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">调整 AL-1S 的本地体验。</p>
      </div>

      <div className="grid gap-2">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">主题</h3>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
            const isActive = themeMode === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setThemeMode(value)}
                className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-100 dark:border-rose-300/50 dark:bg-rose-300/10 dark:text-rose-100 dark:ring-rose-300/10'
                    : 'border-rose-100 bg-white text-slate-600 hover:bg-rose-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm shadow-rose-100 dark:bg-white/10 dark:text-rose-200 dark:shadow-none">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs opacity-75">{description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
