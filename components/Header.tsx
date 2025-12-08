import React from 'react';
import { Sparkles, Youtube, Key, Zap } from 'lucide-react';
import { AIProvider } from '../types';

interface HeaderProps {
  onResetApiKey?: () => void;
  currentProvider?: AIProvider;
}

const Header: React.FC<HeaderProps> = ({ onResetApiKey, currentProvider = 'gemini' }) => {
  const providerInfo = currentProvider === 'gemini' 
    ? { icon: Sparkles, name: 'Gemini 2.5', color: 'text-brand-500' }
    : { icon: Zap, name: 'Claude 3.5', color: 'text-purple-500' };
  
  const ProviderIcon = providerInfo.icon;
  
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Youtube className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AI StoryLab
          </h1>
        </div>
        <div className="flex items-center gap-3 md:gap-4 text-sm text-gray-400">
          <div className="hidden sm:flex items-center gap-1">
            <ProviderIcon className={`w-4 h-4 ${providerInfo.color}`} />
            <span>{providerInfo.name} 기반</span>
          </div>
          {onResetApiKey && (
            <button
              onClick={onResetApiKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-yellow-900/20 text-xs md:text-sm"
              title="API 키 변경"
            >
              <Key className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">API 키 변경</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;