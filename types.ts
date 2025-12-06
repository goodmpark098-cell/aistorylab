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