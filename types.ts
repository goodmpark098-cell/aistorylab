export interface ScriptRequest {
  originalTranscript: string;
  newTopic: string;
}

export interface AnalysisResult {
  structureSummary: string;
  suggestedTopics: string[];
}

export interface ScriptResponse {
  newScript: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

// AI Studio global types
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}