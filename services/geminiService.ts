import { GoogleGenAI } from "@google/genai";

declare const process: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (prompt: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) => {
  try {
    if (!process.env.API_KEY) {
      return "API Key가 설정되지 않았습니다. AI 기능을 사용하려면 API Key를 연결해주세요.";
    }

    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: "당신은 '비즈니스 업무 협업 플랫폼'의 똑똑한 AI 비서입니다. 사용자 '김태호'님의 업무 생산성을 높이기 위해 정중하고 명확하게 답변하세요. 한국어로 대답하세요.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "죄송합니다. 현재 AI 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.";
  }
};