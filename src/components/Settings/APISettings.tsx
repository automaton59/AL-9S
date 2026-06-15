import { useState } from 'react';
import { useSettingsStore } from '../../stores/settings';

export function APISettings() {
  const { llmConfig, updateLLMConfig, isConfigured } = useSettingsStore();

  const [localConfig, setLocalConfig] = useState(llmConfig);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    updateLLMConfig(localConfig);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Settings</h2>

      {!isConfigured && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Please configure your API settings to start chatting.
          </p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            value={localConfig.provider}
            onChange={(e) => setLocalConfig({ ...localConfig, provider: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="openai">OpenAI</option>
            <option value="deepseek">Deepseek</option>
            <option value="custom">Custom (OpenAI-compatible)</option>
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={localConfig.apiKey}
            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={localConfig.model}
            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
            placeholder="gpt-4o-mini"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Base URL */}
        {(localConfig.provider === 'custom' || localConfig.provider === 'deepseek') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={localConfig.baseURL || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, baseURL: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
