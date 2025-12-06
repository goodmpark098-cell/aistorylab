import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import OutputDisplay from './components/OutputDisplay';
import { analyzeTranscript, generateViralScriptStream } from './services/geminiService';
import { AppState, AnalysisResult } from './types';
import { Key, Sparkles, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedContent, setGeneratedContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  
  // Keep original script in ref to reuse during generation phase without re-rendering input form unnecessarily
  const originalScriptRef = useRef<string>('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } else {
      // Check if VITE_GEMINI_API_KEY is set in environment
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      setHasApiKey(!!apiKey && apiKey.trim() !== '');
    }
    setIsCheckingKey(false);
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success as per guidelines to avoid race conditions
        setHasApiKey(true);
      } catch (error) {
        console.error("API Key selection failed:", error);
        // Retry logic could go here, but for now we let the user try again
      }
    }
  };

  const handleAnalysis = useCallback(async (original: string) => {
    originalScriptRef.current = original;
    setAppState(AppState.ANALYZING);
    try {
      const result = await analyzeTranscript(original);
      setAnalysisResult(result);
      setAppState(AppState.ANALYSIS_COMPLETE);
    } catch (error) {
      console.error('Failed to analyze script', error);
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleGeneration = useCallback(async (topic: string) => {
    if (!analysisResult) return;

    setAppState(AppState.GENERATING);
    setGeneratedContent(''); // Clear previous content

    try {
      await generateViralScriptStream(
        originalScriptRef.current,
        analysisResult.structureSummary,
        topic, 
        (chunk) => {
          setGeneratedContent(prev => prev + chunk);
        }
      );
      setAppState(AppState.COMPLETE);
    } catch (error) {
      console.error('Failed to generate script', error);
      setAppState(AppState.ERROR);
    }
  }, [analysisResult]);

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setGeneratedContent('');
    setAnalysisResult(null);
    originalScriptRef.current = '';
  };

  const handleNewScript = () => {
    setGeneratedContent('');
    // If analysis exists, go back to step 2 (ANALYSIS_COMPLETE), otherwise IDLE
    if (analysisResult) {
      setAppState(AppState.ANALYSIS_COMPLETE);
    } else {
      setAppState(AppState.IDLE);
    }
  };

  const handleContentChange = (newContent: string) => {
    setGeneratedContent(newContent);
  };

  // Loading Screen while checking key status
  if (isCheckingKey) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // API Key Setup Screen
  if (!hasApiKey) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-white p-6">
        <div className="max-w-2xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
          <div className="flex items-center justify-center mb-6">
            <Key className="w-16 h-16 text-brand-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
            Google Gemini API 키가 필요합니다
          </h1>
          
          <p className="text-gray-300 text-center mb-8 leading-relaxed">
            AI Story Lab을 사용하려면 Google Gemini API 키가 필요합니다.<br/>
            무료로 발급받을 수 있으며, 설정은 1분이면 완료됩니다.
          </p>

          <div className="bg-gray-800/50 rounded-lg p-6 mb-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              API 키 발급 및 설정 방법
            </h2>
            
            <div className="space-y-3 text-gray-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-medium text-white mb-1">API 키 발급</p>
                  <p className="text-sm">
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-300 underline inline-flex items-center gap-1"
                    >
                      Google AI Studio <ExternalLink className="w-3 h-3" />
                    </a>
                    에서 "Create API Key" 버튼을 클릭하여 키를 생성하세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-medium text-white mb-1">API 키 저장</p>
                  <p className="text-sm">
                    프로젝트 루트 폴더의 <code className="bg-gray-700 px-2 py-1 rounded text-brand-300">.env</code> 파일을 열고<br/>
                    발급받은 키를 다음과 같이 입력하세요:
                  </p>
                  <div className="mt-2 bg-gray-900 rounded p-3 font-mono text-xs text-green-400">
                    VITE_GEMINI_API_KEY=여기에_발급받은_API_키_입력
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="font-medium text-white mb-1">서버 재시작</p>
                  <p className="text-sm">
                    개발 서버를 재시작하세요 (터미널에서 Ctrl+C 후 <code className="bg-gray-700 px-2 py-1 rounded text-brand-300">npm run dev</code>)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-0.5">💡</span>
              <span>
                <strong>무료 할당량:</strong> Google Gemini API는 매월 무료 사용량을 제공합니다. 
                일반적인 사용에는 충분하며, 초과 시 과금이 발생합니다.
              </span>
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Key className="w-5 h-5" />
            API 키 설정 후 새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col font-sans overflow-hidden relative">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* Left Column: Input (Analysis & Config) */}
          <section className="h-full min-h-0 flex flex-col">
            <InputForm 
              onAnalyze={handleAnalysis}
              onGenerate={handleGeneration}
              onReset={handleReset}
              appState={appState}
              analysisResult={analysisResult}
            />
          </section>

          {/* Right Column: Output (Final Script) */}
          <section className="h-full min-h-0 flex flex-col">
            <OutputDisplay 
              content={generatedContent} 
              onContentChange={handleContentChange}
              appState={appState} 
              onReset={handleReset}
              onNewScript={handleNewScript}
            />
          </section>

        </div>
      </main>

      {/* Footer for mobile/scroll contexts - fixed at bottom of screen in this layout */}
      <footer className="flex-none py-4 text-center text-gray-600 text-sm border-t border-gray-900 bg-gray-950">
        <p>© {new Date().getFullYear()} AI StoryLab. YouTube와 관련 없음.</p>
      </footer>

      {/* API Key Modal Popup */}
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px] transition-all duration-500">
          <div className="w-full max-w-md bg-gray-900/95 border border-gray-700 rounded-2xl p-8 shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <Key className="w-7 h-7 text-brand-500" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Gemini API 연결</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                서비스 이용을 위해 Google Gemini API 키가 필요합니다.<br/>
                <span className="text-gray-500 text-xs mt-1 block">
                  키는 서버에 저장되지 않고 브라우저에서 안전하게 처리됩니다.
                </span>
              </p>

              <div className="w-full space-y-3">
                <button 
                  onClick={handleSelectKey}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  API 키 연결 / 선택하기
                </button>
                
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-4"
                >
                  API Key가 없으신가요? (발급 안내) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-800 w-full">
                <p className="text-[11px] text-gray-600">
                  * Google Cloud 프로젝트 또는 AI Studio의 키를 유동적으로 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;