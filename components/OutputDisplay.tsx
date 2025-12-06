import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, AlertCircle, Edit3, Download, Save, X, Hourglass, FilePlus, FileText, Captions } from 'lucide-react';
import { AppState } from '../types';

interface OutputDisplayProps {
  content: string;
  appState: AppState;
  onReset: () => void;
  onNewScript: () => void;
  onContentChange: (newContent: string) => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, appState, onReset, onNewScript, onContentChange }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({ txt: true, srt: false });

  // Sync buffer when content changes (streaming) or when edit mode opens
  useEffect(() => {
    if (!isEditing) {
      setEditBuffer(content);
    }
  }, [content, isEditing]);

  // Countdown timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === AppState.GENERATING) {
      setTimeLeft(60); // Start from 60 seconds
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [appState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- SRT Generation Logic ---
  const generateSRT = (script: string): string => {
    const lines = script.split('\n');
    const srtEntries: { start: number; text: string }[] = [];
    const timeRegex = /\(?(\d{2}):(\d{2})\)?/;

    let currentEntry: { start: number; text: string[] } | null = null;

    lines.forEach((line) => {
      const match = line.match(timeRegex);
      if (match) {
        // Found a new timestamp
        if (currentEntry) {
          srtEntries.push({
            start: currentEntry.start,
            text: currentEntry.text.join('\n').trim()
          });
        }
        
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const totalSeconds = mins * 60 + secs;

        // Remove the timestamp and markdown visuals from the text line for cleaner subtitle
        let cleanText = line.replace(timeRegex, '').trim();
        // Remove bold markers and brackets (e.g., **[Visual]**) roughly
        cleanText = cleanText.replace(/\*\*/g, '').replace(/\[.*?\]/g, '').trim();

        currentEntry = {
          start: totalSeconds,
          text: cleanText ? [cleanText] : []
        };
      } else if (currentEntry) {
        // Append text to current timestamp block
        // Remove markdown headers/bolding for SRT readability
        let cleanLine = line.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').trim();
        if (cleanLine) {
          currentEntry.text.push(cleanLine);
        }
      }
    });

    // Push last entry
    if (currentEntry) {
      srtEntries.push({
        start: currentEntry.start,
        text: currentEntry.text.join('\n').trim()
      });
    }

    // Format to SRT
    return srtEntries.map((entry, index) => {
      const nextEntry = srtEntries[index + 1];
      // Estimate duration: if next entry exists, use that. Otherwise, estimate 3s or based on length.
      const endTime = nextEntry ? nextEntry.start : entry.start + Math.max(3, entry.text.length / 10);
      
      const formatSRTTime = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 1000);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
      };

      return `${index + 1}\n${formatSRTTime(entry.start)} --> ${formatSRTTime(endTime)}\n${entry.text}\n`;
    }).join('\n');
  };

  const handleBatchDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseFilename = `AI_StoryLab_Script_${timestamp}`;

    if (downloadOptions.txt) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (downloadOptions.srt) {
      // Small delay to ensure browser handles dual download
      setTimeout(() => {
        const srtContent = generateSRT(content);
        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, downloadOptions.txt ? 500 : 0);
    }

    setShowDownloadModal(false);
  };

  const startEditing = () => {
    setEditBuffer(content);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditBuffer(content); // Revert
  };

  // Helper to recalculate timestamps based on character count estimate (approx 4.5 chars per second for speaking)
  const recalculateTimestamps = (script: string): string => {
    const lines = script.split('\n');
    let currentTime = 0; // in seconds
    const CHARS_PER_SECOND = 4.5;
    
    // Regex to match timestamp pattern like **(00:00)** or (00:00)
    const timeRegex = /\(?\d{2}:\d{2}\)?/;

    const processedLines = lines.map((line) => {
      // Check if line contains a timestamp to replace
      if (timeRegex.test(line)) {
        // Format current time as MM:SS
        const mins = Math.floor(currentTime / 60).toString().padStart(2, '0');
        const secs = Math.floor(currentTime % 60).toString().padStart(2, '0');
        const newTimestamp = `(${mins}:${secs})`;
        
        // Replace existing timestamp with new one
        return line.replace(timeRegex, newTimestamp);
      } else {
        // Accumulate time based on text length (ignoring structure headers)
        if (!line.startsWith('#') && line.trim().length > 0) {
          currentTime += line.length / CHARS_PER_SECOND;
        }
        return line;
      }
    });

    return processedLines.join('\n');
  };

  const saveEditing = () => {
    // Recalculate timestamps before saving
    const adjustedContent = recalculateTimestamps(editBuffer);
    onContentChange(adjustedContent);
    setIsEditing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isGenerating = appState === AppState.GENERATING;

  // Waiting State (Before Generation or After Reset)
  if (appState === AppState.IDLE || appState === AppState.ANALYZING || appState === AppState.ANALYSIS_COMPLETE) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 h-full flex flex-col items-center justify-center text-center text-gray-500 border-dashed relative overflow-hidden">
        
        {/* Animated Background Elements for visual interest */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
           <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 relative">
          <Hourglass className="w-10 h-10 text-brand-500/70 animate-spin-slow duration-[5000ms]" />
          <div className="absolute -bottom-2 bg-gray-900 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-700 text-brand-500">
            00:00
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-300 mb-2">대본 생성 대기 중</h3>
        <p className="max-w-xs mx-auto break-keep text-sm leading-relaxed text-gray-400">
          왼쪽에서 주제를 선택하고 <strong className="text-brand-400">대본 생성</strong> 버튼을 누르면<br/>
          분석된 구조에 맞춘 새 대본이 작성됩니다.
        </p>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
     return (
      <div className="bg-gray-900 rounded-2xl border border-red-900/50 p-8 h-full flex flex-col items-center justify-center text-center text-red-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold mb-2">생성 실패</h3>
        <p className="mb-6">Gemini 연결 중 문제가 발생했습니다.</p>
        <button 
            onClick={onReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
        >
            다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl h-full flex flex-col overflow-hidden relative">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 gap-4 sm:gap-0 flex-none z-10 min-h-[64px]">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 whitespace-nowrap">
          {isGenerating ? (
            <>
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse flex-none" />
              <span className="text-brand-400">작성 중...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 flex-none" />
              <span>생성 결과</span>
            </>
          )}
        </h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit / Save Actions */}
          {!isEditing ? (
            <button
              onClick={startEditing}
              disabled={isGenerating}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${isGenerating 
                  ? 'opacity-50 cursor-not-allowed text-gray-500' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <Edit3 className="w-4 h-4" />
              수정
            </button>
          ) : (
            <>
               <button
                onClick={cancelEditing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
                취소
              </button>
              <button
                onClick={saveEditing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-900/20"
              >
                <Save className="w-4 h-4" />
                저장 완료
              </button>
            </>
          )}

          {/* Export Actions (Only visible when not editing) */}
          {!isEditing && (
            <>
              <div className="w-px h-4 bg-gray-700 mx-1" /> {/* Divider */}
              
              <button
                onClick={() => setShowDownloadModal(true)}
                disabled={isGenerating}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isGenerating 
                    ? 'opacity-50 cursor-not-allowed text-gray-500' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
                title="파일로 저장"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">다운로드</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${copied 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사됨' : '복사'}
              </button>
              
              <div className="w-px h-4 bg-gray-700 mx-1" /> {/* Divider */}

              <button
                onClick={onNewScript}
                disabled={isGenerating}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isGenerating 
                    ? 'opacity-50 cursor-not-allowed text-gray-500' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
                title="현재 결과를 지우고 새 주제로 생성"
              >
                <FilePlus className="w-4 h-4" />
                <span className="hidden lg:inline">새로 만들기</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-0 overflow-hidden bg-gray-950/50 relative">
        
        {/* Generation Overlay - Persistent until COMPLETE */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/70 backdrop-blur-[2px] z-30 transition-all duration-500 select-none">
            <div className="relative mb-8 transform scale-110">
              <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl flex items-center justify-center ring-1 ring-gray-700/50">
                <Hourglass className="w-14 h-14 text-brand-500 animate-spin-slow duration-[3000ms]" />
              </div>
            </div>
            <div className="text-6xl font-bold text-white font-mono tracking-wider mb-5 tabular-nums drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>
            <p className="text-gray-300 animate-pulse font-medium text-lg drop-shadow-md">AI 시나리오 작가가 집필을 시작했습니다...</p>
          </div>
        )}

        {isEditing ? (
          <textarea
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            className="w-full h-full p-8 bg-gray-950 text-gray-100 resize-none outline-none font-sans text-base sm:text-lg leading-loose selection:bg-brand-900 selection:text-white placeholder-gray-700"
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 relative">
            {/* Main Content - Dimmed when generating */}
            <div className={`prose prose-invert prose-brand max-w-none transition-all duration-700 ${isGenerating ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
              <ReactMarkdown
                components={{
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-6 mb-4 pb-2 border-b border-gray-800" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed break-keep" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300" {...props} />,
                  li: ({node, ...props}) => <li className="" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-brand-400" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-500" />
                다운로드 형식 선택
              </h3>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={downloadOptions.txt}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, txt: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-gray-900 accent-brand-500"
                />
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-white" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">텍스트 파일 (.txt)</span>
                    <span className="text-xs text-gray-500">대본 전체 내용 (읽기 전용)</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={downloadOptions.srt}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, srt: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-gray-900 accent-brand-500"
                />
                <div className="flex items-center gap-2">
                  <Captions className="w-5 h-5 text-gray-400 group-hover:text-white" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">자막 파일 (.srt)</span>
                    <span className="text-xs text-gray-500">유튜브 자막/영상 편집용</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleBatchDownload}
                disabled={!downloadOptions.txt && !downloadOptions.srt}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all shadow-lg
                  ${(!downloadOptions.txt && !downloadOptions.srt)
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-900/20'}
                `}
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputDisplay;