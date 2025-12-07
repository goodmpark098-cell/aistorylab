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
    
    ⚠️ **최우선 원칙: 중복 콘텐츠 0% 목표**
    - 원본 대본은 **구조 분석용으로만** 사용. 내용은 절대 참고 금지
    - 원본의 단어, 문장, 표현, 비유, 사례, 에피소드 **완전 금지**
    - ${newTopic}에 대해 **인터넷 검색하듯이 완전히 새로운 정보**로 작성
    - 말투도 완전히 다르게: 원본이 "~했어요"면 새 대본은 "~합니다" 스타일로
    
    📏 **분량 요구사항 (절대 준수!)**
    - **목표: 최소 12,000자 이상 (약 1시간 분량)**
    - 원본 대본이 길면 15,000~20,000자로 작성
    - 각 섹션별 최소 글자수:
      * 도입부(0~5분): 최소 1,000자
      * 전개부(5~30분): 최소 6,000자 (디테일하게!)
      * 클라이맥스(30~50분): 최소 4,000자
      * 마무리(50~60분): 최소 1,000자
    - 타임스탬프를 촘촘하게 배치 (15~30초 간격)
    - 각 타임스탬프마다 **최소 5-8문장**의 풍부한 대사
    - 짧게 요약 절대 금지, **완전한 풀버전**으로 작성
    
    📋 작성 원칙:
    1. **구조만 참고**: "${structureSummary}" ← 이 패턴(타이밍)만 따르세요
    2. **내용 100% 신규**: ${newTopic}에 대한 독자적인 리서치 결과처럼 작성
    3. **표현 완전 변경**: 
       - 원본이 질문형 → 새 대본은 단언형
       - 원본이 스토리텔링 → 새 대본은 데이터 중심
       - 원본이 감성적 → 새 대본은 논리적
    4. **고유 에피소드**: ${newTopic}만의 실제 사례/통계/뉴스 활용
    5. **길게 풀어쓰기**: 각 포인트마다 충분한 설명, 예시, 부연 추가
    
    ❌ 절대 하지 말 것:
    - 원본 대본의 어떤 문장도 재활용 금지
    - 원본의 키워드나 표현 차용 금지
    - 비슷한 구조의 문장이라도 단어는 완전히 다르게
    - **HTML 태그 사용 금지** (<br>, <p> 등 절대 금지)
    
    📝 작성 형식:
    - **순수 마크다운만 사용** (HTML 태그 금지!)
    - 줄바꿈은 그냥 빈 줄로만 표현
    - 타임스탬프 **(00:00)** 형식 사용
    - 시각 연출: **[화면: ...]** 형태로 표시
    - 각 타임스탬프 섹션 사이에 빈 줄 1개
    
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