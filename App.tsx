import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import OutputDisplay from './components/OutputDisplay';
import ApiKeySetup from './components/ApiKeySetup';
import { analyzeTranscript, generateViralScriptStream } from './services/geminiService';
import { AppState, AnalysisResult } from './types';

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

  const checkApiKey = () => {
    // localStorage에서 API 키 확인
    const apiKey = localStorage.getItem('gemini_api_key');
    setHasApiKey(!!apiKey && apiKey.trim() !== '');
    setIsCheckingKey(false);
  };

  const handleApiKeySet = () => {
    checkApiKey();
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
    return <ApiKeySetup onApiKeySet={handleApiKeySet} />;
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
    </div>
  );
};

export default App;