import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const getClient = () => {
  // localStorage에서 사용자가 입력한 API 키 가져오기
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. API 키를 먼저 입력해주세요.");
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
    
    ⚠️ **중요: YouTube 중복 콘텐츠 방지 원칙**
    - 원본 대본의 **구조와 패턴만** 분석하여 참고할 것
    - 원본의 말투, 단어, 에피소드, 사례는 **절대 사용 금지**
    - 새로운 주제에 맞는 **완전히 독창적인 내용**을 작성할 것
    - 같은 구조라도 표현 방식을 다르게 할 것 (예: 원본이 질문형이면 새로운 대본은 선언형으로)
    
    목표: 
    [원본 대본]의 성공 공식(후킹 타이밍, 속도감, 전개 방식, CTA 위치 등 **구조적 요소만**)을 벤치마킹하여, 
    [새로운 주제]에 대한 **완전히 새로운** 유튜브 대본을 작성하세요.
    
    입력 데이터:
    1. 원본 대본: """${originalTranscript}"""
    2. 원본 구조 특징: "${structureSummary}"
    3. 새로운 주제: "${newTopic}"
    
    작성 가이드:
    - 언어: 자연스러운 한국어 구어체 (유튜브 감성)
    - 형식: 마크다운 (Markdown)
    - 시각적 연출: 볼드체로 카메라 앵글이나 B-roll 지시사항 포함 (예: **[화면 전환: 빠르게 지나가는 도시 풍경]**)
    - **구조 참고**: 원본의 후킹 타이밍, 전개 속도, 클라이맥스 위치, CTA 타이밍만 따르되
    - **내용 독창성**: 새로운 주제에 맞는 독창적인 스토리, 에피소드, 데이터, 비유를 사용
    - **말투 차별화**: 원본과 다른 말투/문체로 작성 (원본이 친근하면 새로운 대본은 전문적으로)
    - **필수 포맷팅 1**: 가독성을 위해 각 타임스탬프(예: **(00:00)**) 섹션 사이에는 반드시 **빈 줄(엔터 2번)**을 넣어 문단을 명확히 구분하세요.
    - **필수 포맷팅 2**: 맨 앞부분에는 **[새로운 주제]에 구조를 어떻게 적용했는지**에 대한 '기획 의도'를 작성하세요.
    
    출력 형식 예시:
    
    ## 🧬 기획 의도: ${newTopic}
    *이 대본은 원본의 [구조적 패턴: 예를 들어 '5초 후킹→문제 제기→해결책 3단계→CTA']를 분석하여, ${newTopic}라는 새로운 주제에 적용했습니다. 원본 내용은 사용하지 않고, 이 주제만의 독창적인 스토리와 데이터로 재구성했습니다.*
    
    ---
    
    ## 🎬 새로운 대본: ${newTopic}
    
    **(00:00)** **[화면 전환: 강렬한 인트로]** 
    이 주제에 맞는 완전히 새로운 오프닝 멘트입니다.
    
    **(00:30)** **[자료 화면: 새로운 자료]** 
    원본과는 다른 독창적인 본론 내용이 이어집니다.
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