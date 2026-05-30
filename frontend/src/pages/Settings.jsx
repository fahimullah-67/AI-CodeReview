import { useState, useEffect } from "react";
import { getConfig, saveConfig } from "../utils/storage";
import { Check } from "lucide-react";
import axios from "axios";

const PROVIDERS = {
  google: {
    name: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-flash-latest"],
    keyLabel: "Gemini API Key",
    keyLink: "https://aistudio.google.com",
    placeholder: "AIza...",
  },
  anthropic: {
    name: "Anthropic Claude",
    models: ["claude-sonnet-4-6", "claude-haiku-4-5-20251001", "claude-opus-4-6"],
    keyLabel: "Anthropic API Key",
    keyLink: "https://console.anthropic.com",
    placeholder: "sk-ant-...",
  },
  openai: {
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    keyLabel: "OpenAI API Key",
    keyLink: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
};

export default function Settings() {
  const [config, setConfig] = useState(getConfig());
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const provider = PROVIDERS[config.provider];

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-gray-400 mb-8">Configure your AI model and preferences</p>

      <div className="max-w-2xl space-y-6">

        {/* Provider Selection */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">AI Provider</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <button
                key={id}
                onClick={() => setConfig((c) => ({
                  ...c,
                  provider: id,
                  model: p.models[0],
                  api_key: ""
                }))}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left
                  ${config.provider === id
                    ? "border-purple-500 bg-purple-900/20 text-purple-300"
                    : "border-[#21262d] text-gray-400 hover:border-gray-500"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">Model</h2>
          <select
            value={config.model}
            onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500">
            {provider.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-gray-500 text-xs mt-2">
            Selected: <span className="text-purple-400">{config.provider}/{config.model}</span>
          </p>
        </div>

        {/* API Key */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">{provider.keyLabel}</h2>
            <a
              href={provider.keyLink}
              target="_blank" rel="noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300">
              Get API key →
            </a>
          </div>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder={provider.placeholder}
              value={config.api_key}
              onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 pr-20"
            />
            <button
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white">
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Stored locally in your browser only. Never sent to our servers.
          </p>
        </div>

        {/* GitHub Options */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">GitHub Options</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setConfig((c) => ({ ...c, post_to_github: !c.post_to_github }))}
              className={`w-10 h-6 rounded-full transition-colors relative
                ${config.post_to_github ? "bg-purple-600" : "bg-gray-600"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all
                ${config.post_to_github ? "left-5" : "left-1"}`} />
            </div>
            <div>
              <div className="text-sm font-medium">Post review to GitHub PR</div>
              <div className="text-xs text-gray-400">
                AI comments will appear on your GitHub pull request
              </div>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors
            ${saved
              ? "bg-green-600 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
          {saved ? <><Check size={16} /> Saved!</> : "Save Settings"}
        </button>

      </div>
    </div>
  );
}