import React, { useState, useEffect } from 'react';
import { ArrowRight, FileText, Wand2, Search, CheckCircle2, RotateCcw } from 'lucide-react';
import { AppState, AnalysisResult } from '../types';

interface InputFormProps {
  onAnalyze: (original: string) => void;
  onGenerate: (topic: string) => void;
  onReset: () => void;
  appState: AppState;
  analysisResult: AnalysisResult | null;
}

const InputForm: React.FC<InputFormProps> = ({ 
  onAnalyze, 
  onGenerate, 
  onReset,
  appState, 
  analysisResult 
}) => {
  const [originalScript, setOriginalScript] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Reset local state when full reset happens
  useEffect(() => {
    if (appState === AppState.IDLE) {
      setOriginalScript('');
      setCustomTopic('');
      setSelectedTopic('');
    }
  }, [appState]);

  const handleAnalyzeClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (originalScript.trim()) {
      onAnalyze(originalScript);
    }
  };

  const handleGenerateClick = () => {
    const topic = customTopic.trim() || selectedTopic;
    if (topic) {
      onGenerate(topic);
    }
  };

  const isAnalyzing = appState === AppState.ANALYZING;
  const isAnalysisComplete = appState === AppState.ANALYSIS_COMPLETE || appState === AppState.GENERATING || appState === AppState.COMPLETE;
  const isGenerating = appState === AppState.GENERATING;

  // Render Step 1: Input Original Script
  if (!isAnalysisComplete && appState !== AppState.ANALYZING) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl h-full flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="p-4 md:p-6 pb-0 flex-none">
          <div className="mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-brand-500" />
              1단계: 원본 대본 입력
            </h2>
            <p className="text-gray-400 text-sm">떡상한 영상의 대본을 여기에 붙여넣으세요. AI가 성공 공식을 분석합니다.</p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 px-4 md:px-6 pb-2 overflow-y-auto">
          <textarea
            value={originalScript}
            onChange={(e) => setOriginalScript(e.target.value)}
            placeholder="영상 스크립트 붙여넣기..."
            className="w-full h-full min-h-[400px] md:min-h-[200px] bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none transition-all text-base md:text-sm leading-relaxed"
          />
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 md:p-6 pt-3 md:pt-4 flex-none border-t border-gray-800/50 bg-gray-900">
          <button
            onClick={handleAnalyzeClick}
            disabled={!originalScript.trim()}
            className={`
              w-full flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-semibold text-white transition-all duration-200 text-base
              ${!originalScript.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/20 active:scale-[0.98]'}
            `}
          >
            <Search className="w-5 h-5" />
            <span>구조 분석 시작하기</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Loading State (Analyzing)
  if (isAnalyzing) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl h-full flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">대본 분석 중...</h3>
        <p className="text-gray-400">후킹 요소와 스토리 구조를 파악하고 있습니다.</p>
      </div>
    );
  }

  // Render Step 2: Select Topic & Generate
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-4 md:p-6 pb-3 md:pb-4 flex-none border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-brand-500" />
            2단계: 주제 선정
          </h2>
          <button onClick={onReset} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3 h-3" /> 처음으로
          </button>
        </div>
      </div>

      {/* Content - Scrollable (Only Analysis Summary & Topics List) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="bg-gray-950/50 rounded-xl p-3 md:p-4 border border-gray-800 mb-4 md:mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">🔍 분석된 구조 요약</h3>
          <p className="text-sm text-gray-400 leading-relaxed italic">
            "{analysisResult?.structureSummary}"
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            AI 추천 주제 (선택)
          </label>
          <div className="grid gap-2 md:gap-3">
            {analysisResult?.suggestedTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedTopic(topic);
                  setCustomTopic('');
                }}
                disabled={isGenerating}
                className={`
                  w-full text-left p-3 md:p-3 rounded-lg border text-base md:text-sm transition-all relative
                  ${selectedTopic === topic 
                    ? 'bg-brand-500/10 border-brand-500 text-brand-200 ring-1 ring-brand-500' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'}
                `}
              >
                {topic}
                {selectedTopic === topic && (
                  <CheckCircle2 className="w-4 h-4 text-brand-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Fixed (Input & Button) */}
      <div className="p-4 md:p-6 pt-4 flex-none border-t border-gray-800/50 bg-gray-900">
        <div className="mb-3 md:mb-4">
           <label className="block text-sm font-medium text-gray-300 mb-2">
            또는 직접 입력
          </label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              setSelectedTopic('');
            }}
            placeholder="원하는 주제가 있다면 직접 입력하세요"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-base text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            disabled={isGenerating}
          />
        </div>

        <button
          onClick={handleGenerateClick}
          disabled={isGenerating || (!selectedTopic && !customTopic.trim())}
          className={`
            w-full flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-semibold text-white transition-all duration-200 text-base
            ${isGenerating || (!selectedTopic && !customTopic.trim())
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/20 active:scale-[0.98]'}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>새 대본 작성 중...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>이 주제로 대본 생성</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;