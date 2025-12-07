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
    1. 이 영상이 성공한 **구조적 패턴**만 추출하세요 (예: "첫 3초 충격 후킹 → 문제 제기 → 3단계 해결책 → 반전 → CTA")
    2. 후킹 타이밍, 전개 속도, 감정 곡선, CTA 위치 등 **타이밍과 패턴**만 분석
    3. 이 구조를 적용할 수 있는 **완전히 다른 분야**의 주제 3가지 추천
    
    ⚠️ 주의: 원본의 내용, 단어, 표현은 분석 결과에 포함하지 마세요. 오직 구조와 패턴만 추출하세요.
    
    입력된 대본: """${originalTranscript}"""
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      structureSummary: {
        type: Type.STRING,
        description: "타이밍과 전개 패턴만 포함한 구조적 분석 (원본 내용 제외)",
      },
      suggestedTopics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "완전히 다른 분야의 추천 주제 3가지",
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
    
    🎬 **작성 미션:**
    "${newTopic}"를 주제로 한 **1시간 분량(12,000자 이상)**의 완전한 유튜브 대본을 작성하세요.
    
    📋 **참고 구조 패턴:**
    ${structureSummary}
    ↑ 이 타이밍과 전개 방식만 참고하되, 내용은 ${newTopic}에 맞게 완전히 새롭게 창작하세요.
    
    ✍️ **작성 지침:**
    
    1. **분량 (가장 중요!):**
       - **최소 12,000자 이상** 작성 (1시간 분량)
       - 타임스탬프를 20~30초 간격으로 촘촘하게 배치
       - 각 타임스탬프마다 **6-10문장**의 풍부한 대사
       - 짧게 끝내지 말고, 충분히 길고 디테일하게 작성
    
    2. **내용 창작:**
       - ${newTopic}에 대해 풍부한 스토리를 창작
       - 구체적인 에피소드, 대화, 갈등, 반전 요소 추가
       - 실제 사례, 통계, 데이터를 활용하여 신빙성 높이기
       - 등장인물, 배경, 상황을 생생하게 묘사
    
    3. **구조 활용:**
       - 위의 구조 패턴을 타이밍 가이드로만 활용
       - 각 섹션(도입, 전개, 클라이맥스, 마무리)을 충분히 길게 풀어쓰기
    
    📏 **섹션별 최소 분량:**
    - 도입부 (0~10분): 2,000자 - 주제 소개, 배경 설정
    - 전개부 (10~35분): 6,000자 - 본론, 에피소드, 갈등
    - 클라이맥스 (35~55분): 3,000자 - 절정, 반전
    - 마무리 (55~60분): 1,000자 - 정리, CTA
    
    4. **스토리텔링 요소 풍부하게:**
       - 에피소드: 구체적이고 생생한 장면 묘사
       - 대화: 등장인물의 대사를 직접 인용
       - 감정: 긴장감, 갈등, 희망 등을 표현
       - 디테일: 시간, 장소, 상황을 구체적으로
    
    ❌ **금지 사항:**
    - 10분 이하로 끝내기 (너무 짧음!)
    - 요약 형식으로 작성
    - HTML 태그 사용 (<br>, <p> 등)
    
    📝 **작성 형식:**
    - 순수 마크다운만 사용
    - 타임스탬프: **(00:00)**, **(00:30)**, **(01:00)**...
    - 시각 연출: **[화면: ...]**
    - 각 타임스탬프 사이에 빈 줄 1개
    
    💡 **작성 팁:**
    - 서두르지 말고 천천히 풀어쓰기
    - 각 장면을 영화처럼 생생하게 묘사
    - "그리고 그 다음..." 식으로 계속 이어가기
    - 12,000자가 목표이므로 충분히 길게 작성할 것
    
    출력 예시:
    
    ## 🎯 기획 의도: ${newTopic}
    *구조 패턴 "${structureSummary}"를 ${newTopic}에 적용. 원본 내용은 전혀 사용하지 않고, ${newTopic} 분야의 독자적인 데이터와 사례로 완전히 새롭게 구성.*
    
    ---
    
    ## 🎬 대본: ${newTopic}
    
    **(00:00)** **[화면: 임팩트 있는 오프닝]**
    ${newTopic}에 맞는 독창적인 첫 문장 (원본과 전혀 다른 표현)
    
    **(00:15)** **[자료: ${newTopic} 관련 데이터]**
    이 주제만의 고유한 내용 전개...
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.95,
        topK: 64,
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