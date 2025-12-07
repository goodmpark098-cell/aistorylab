import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Sparkles } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // 저장된 API 키 불러오기
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      showMessage('저장된 API 키를 불러왔습니다', 'success');
    }
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSaveKey = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      showMessage('API 키를 입력하세요', 'error');
      return;
    }

    if (!trimmedKey.startsWith('AIza')) {
      showMessage('올바른 API 키 형식이 아닙니다 (AIza로 시작해야 함)', 'error');
      return;
    }

    localStorage.setItem('gemini_api_key', trimmedKey);
    showMessage('API 키가 저장되었습니다', 'success');
    onApiKeySet();
  };

  return (
    <div className="h-screen bg-gray-950 flex items-center justify-center text-white p-6">
      <div className="max-w-2xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="flex items-center justify-center mb-6">
          <Key className="w-16 h-16 text-brand-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
          Google Gemini API 키 설정
        </h1>
        
        <p className="text-gray-300 text-center mb-8 leading-relaxed">
          AI Story Lab을 사용하려면 개인 Google Gemini API 키가 필요합니다.<br/>
          무료로 발급받을 수 있으며, 설정은 1분이면 완료됩니다.
        </p>

        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            API 키 발급 방법
          </h2>
          
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-medium text-white mb-1">Google AI Studio 접속</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline inline-flex items-center gap-1 text-sm"
                >
                  https://aistudio.google.com/app/apikey <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-medium text-white mb-1">API 키 생성</p>
                <p className="text-sm">
                  "Create API Key" 버튼 클릭 → "Create API key in new project" 선택
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="font-medium text-white mb-1">API 키 복사 및 입력</p>
                <p className="text-sm">
                  생성된 키를 복사하여 아래 입력창에 붙여넣기
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza... 형식의 API 키를 입력하세요"
              className="w-full bg-gray-800 text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              messageType === 'success' 
                ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                : 'bg-red-900/30 border border-red-500/30 text-red-300'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSaveKey}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Key className="w-5 h-5" />
            API 키 저장하고 시작하기
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-300 flex items-start gap-2">
            <span className="text-blue-400 font-bold mt-0.5">💡</span>
            <span>
              <strong>무료 할당량:</strong> Google Gemini API는 매월 무료 사용량을 제공합니다. 
              일반적인 사용에는 충분하며, 하루 약 750개의 대본을 무료로 생성할 수 있습니다.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
