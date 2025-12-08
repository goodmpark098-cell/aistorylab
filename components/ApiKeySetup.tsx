import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Sparkles, Zap, DollarSign } from 'lucide-react';
import { AIProvider } from '../types';

interface ApiKeySetupProps {
  onApiKeySet: (provider: AIProvider) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // 저장된 API 키 불러오기
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    const savedClaudeKey = localStorage.getItem('claude_api_key');
    
    if (savedProvider && (savedProvider === 'gemini' ? savedGeminiKey : savedClaudeKey)) {
      setProvider(savedProvider);
      setApiKey(savedProvider === 'gemini' ? savedGeminiKey! : savedClaudeKey!);
      showMessage(`저장된 ${savedProvider === 'gemini' ? 'Gemini' : 'Claude'} API 키를 불러왔습니다`, 'success');
    }
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const key = localStorage.getItem(`${newProvider}_api_key`) || '';
    setApiKey(key);
  };

  const handleSaveKey = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      showMessage('API 키를 입력하세요', 'error');
      return;
    }

    if (provider === 'gemini' && !trimmedKey.startsWith('AIza')) {
      showMessage('올바른 Gemini API 키 형식이 아닙니다 (AIza로 시작해야 함)', 'error');
      return;
    }

    if (provider === 'claude' && !trimmedKey.startsWith('sk-ant-')) {
      showMessage('올바른 Claude API 키 형식이 아닙니다 (sk-ant-로 시작해야 함)', 'error');
      return;
    }

    localStorage.setItem(`${provider}_api_key`, trimmedKey);
    localStorage.setItem('ai_provider', provider);
    showMessage('API 키가 저장되었습니다', 'success');
    onApiKeySet(provider);
  };

  return (
    <div className="h-screen bg-gray-950 flex items-center justify-center text-white p-6 overflow-y-auto">
      <div className="max-w-3xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800 my-8">
        <div className="flex items-center justify-center mb-6">
          <Key className="w-16 h-16 text-brand-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
          AI 제공자 선택 및 API 키 설정
        </h1>
        
        <p className="text-gray-300 text-center mb-8 leading-relaxed">
          AI Story Lab을 사용하려면 AI API 키가 필요합니다.<br/>
          원하는 AI 제공자를 선택하고 API 키를 입력하세요.
        </p>

        {/* AI Provider Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Gemini Option */}
          <button
            onClick={() => handleProviderChange('gemini')}
            className={`p-6 rounded-xl border-2 transition-all ${
              provider === 'gemini'
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <Sparkles className={`w-6 h-6 flex-shrink-0 ${provider === 'gemini' ? 'text-brand-500' : 'text-gray-400'}`} />
              <div className="text-left">
                <h3 className="font-bold text-lg mb-1">Google Gemini</h3>
                <p className="text-sm text-gray-400 mb-2">무료 또는 유료 (추천)</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>✓ 무료 할당량 제공</li>
                  <li>✓ 빠른 응답 속도</li>
                  <li>✓ 한국어 우수</li>
                </ul>
              </div>
            </div>
          </button>

          {/* Claude Option */}
          <button
            onClick={() => handleProviderChange('claude')}
            className={`p-6 rounded-xl border-2 transition-all ${
              provider === 'claude'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <Zap className={`w-6 h-6 flex-shrink-0 ${provider === 'claude' ? 'text-purple-500' : 'text-gray-400'}`} />
              <div className="text-left">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  Claude 3.5
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                </h3>
                <p className="text-sm text-yellow-400 mb-2">유료 (고급)</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>✓ 뛰어난 스토리텔링</li>
                  <li>✓ 창의적인 표현</li>
                  <li>✓ 내용 중복 최소화</li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        {/* API Key Instructions */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            {provider === 'gemini' ? 'Gemini' : 'Claude'} API 키 발급 방법
          </h2>
          
          <div className="space-y-3 text-gray-300">
            {provider === 'gemini' ? (
              <>
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
                    <p className="text-sm">"Create API Key" 버튼 클릭 → "Create API key in new project" 선택</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium text-white mb-1">API 키 복사 및 입력</p>
                    <p className="text-sm">생성된 키 (AIza...로 시작)를 복사하여 아래 입력창에 붙여넣기</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium text-white mb-1">Anthropic Console 접속</p>
                    <a 
                      href="https://console.anthropic.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-1 text-sm"
                    >
                      https://console.anthropic.com/ <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium text-white mb-1">신용카드 등록 및 크레딧 충전</p>
                    <p className="text-sm">최소 $5 충전 필요 (약 6,500원)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium text-white mb-1">API 키 생성 및 복사</p>
                    <p className="text-sm">API Keys → Create Key → 생성된 키 (sk-ant-...로 시작)를 복사</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'gemini' ? 'AIza... 형식의 API 키를 입력하세요' : 'sk-ant-... 형식의 API 키를 입력하세요'}
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

        {provider === 'gemini' ? (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-0.5">💡</span>
              <span>
                <strong>무료 할당량:</strong> Google Gemini API는 매월 무료 사용량을 제공합니다. 
                일반적인 사용에는 충분하며, 하루 약 20개의 대본을 무료로 생성할 수 있습니다.
              </span>
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mt-6">
            <p className="text-sm text-yellow-300 flex items-start gap-2">
              <span className="text-yellow-400 font-bold mt-0.5">💰</span>
              <span>
                <strong>예상 비용:</strong> Claude API는 대본 1개당 약 250~650원 정도 소요됩니다. 
                스토리텔링 품질이 우수하며, 같은 내용 반복 없이 창의적인 대본을 생성합니다.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeySetup;
