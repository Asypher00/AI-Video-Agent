// src/components/ConfigPanel.jsx
import React from 'react';
import { Info } from 'lucide-react';

function ConfigPanel({ apiKey, setApiKey, apiProvider, setApiProvider, frameInterval, setFrameInterval, agentStatus }) {
  return (
    <section className="bg-emerald-50 p-6 rounded-2xl shadow-inner border border-emerald-200">
      <h2 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
        <Info className="w-6 h-6" /> Configuration
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Google Gemini API Key
          </label>
          <input
            type="password"
            id="apiKey"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition duration-150"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API Key"
          />
          {apiKey && (
            <p className="text-xs text-gray-500 mt-1">
              Key loaded. Agent Status:{" "}
              <span className={`font-semibold ${
                agentStatus.includes('Error') ? 'text-red-600' : agentStatus === 'Ready' ? 'text-green-600' : 'text-orange-500'
              }`}>
                {agentStatus}
              </span>
            </p>
          )}
        </div>
        <div>
          <label htmlFor="apiProvider" className="block text-sm font-medium text-gray-700 mb-1">
            AI Provider (currently Gemini only)
          </label>
          <select
            id="apiProvider"
            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed shadow-sm"
            value={apiProvider}
            onChange={(e) => setApiProvider(e.target.value)}
            disabled
          >
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
        <div>
          <label htmlFor="frameInterval" className="block text-sm font-medium text-gray-700 mb-1">
            Frame Extraction Interval (seconds)
          </label>
          <input
            type="number"
            id="frameInterval"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition duration-150"
            value={frameInterval}
            onChange={(e) => setFrameInterval(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            placeholder="e.g., 2"
          />
        </div>
      </div>
    </section>
  );
}

export default ConfigPanel;