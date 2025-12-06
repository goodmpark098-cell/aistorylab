import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file");
  }
  return new GoogleGenAI({ apiKey });
};

// 1. First step: Analyze structure and suggest topics
export const analyzeTranscript = async (
  originalTranscript: string
): Promise<AnalysisResult> => {
  const ai = getClient();

  const prompt = `
    당신은 100만 구독자를 보유한 유튜브 전략가입니다.
    
    [입력된 대본]을 분석하여 다음 작업을 수행하세요:
    1. 이 영상이 성공한 구조적 이유(후킹, 속도감, 감정선 등)를 2-3문장으로 요약하세요.
    2. 이 구조를 그대로 적용했을 때 대박이 날 만한 서로 다른 분야의 새로운 주제 3가지를 추천하세요.
    
    입력된 대본: """${originalTranscript}"""
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      structureSummary: {
        type: Type.STRING,
        description: "성공 요인에 대한 구조적 분석 요약 (한국어)",
      },
      suggestedTopics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "이 구조에 적합한 추천 주제 3가지",
      },
    },
    required: ["structureSummary", "suggestedTopics"],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    }
  });

  const text = response.text;
  if (!text) throw new Error("분석 결과를 받지 못했습니다.");
  
  return JSON.parse(text) as AnalysisResult;
};

// 2. Second step: Generate the actual script based on selected topic
export const generateViralScriptStream = async (
  originalTranscript: string,
  structureSummary: string,
  newTopic: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = getClient();
  
  const prompt = `
    당신은 전문 유튜브 스크립트 작가입니다.
    
    목표: 
    [원본 대본]의 성공 공식(구조, 톤앤매너, 호흡)을 완벽하게 벤치마킹하여, 
    [새로운 주제]에 대한 매력적인 유튜브 대본을 작성하세요.
    
    입력 데이터:
    1. 원본 대본: """${originalTranscript}"""
    2. 원본 구조 특징: "${structureSummary}"
    3. 새로운 주제: "${newTopic}"
    
    작성 가이드:
    - 언어: 자연스러운 한국어 구어체 (유튜브 감성)
    - 형식: 마크다운 (Markdown)
    - 시각적 연출: 볼드체로 카메라 앵글이나 B-roll 지시사항 포함 (예: **[화면 전환: 빠르게 지나가는 도시 풍경]**)
    - 구조: 원본의 훅(Hook), 본론 전개 방식, 클라이맥스, CTA 위치를 그대로 따를 것.
    - **필수 포맷팅 1**: 가독성을 위해 각 타임스탬프(예: **(00:00)**) 섹션 사이에는 반드시 **빈 줄(엔터 2번)**을 넣어 문단을 명확히 구분하세요. 절대 내용을 뭉쳐서 쓰지 마세요.
    - **필수 포맷팅 2**: 맨 앞부분에는 [원본 구조]를 단순히 복사하지 말고, **[새로운 주제]에 이 구조를 어떻게 적용했는지**에 대한 '기획 의도'를 새로 작성해주세요.
    
    출력 형식 예시:
    
    ## 🧬 기획 의도: ${newTopic}
    *이 대본은 원본의 [구조적 특징]을 벤치마킹하여, [새로운 주제]를 [어떤 방식]으로 풀어냈습니다. 특히 초반 5초에 [특정 요소]를 배치하여 시청 지속 시간을 높이도록 설계했습니다.*
    
    ---
    
    ## 🎬 새로운 대본: ${newTopic}
    
    **(00:00)** **[화면 전환: 강렬한 인트로]** 
    오프닝 멘트입니다.
    
    **(00:30)** **[자료 화면: 예시 자료]** 
    본론 내용이 이어집니다. 줄바꿈이 확실해야 합니다.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};