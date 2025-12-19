
import { GoogleGenAI, Type } from "@google/genai";
import { AiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const solveMathProblem = async (query: string): Promise<AiResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Solve this mathematical problem or explain this concept: "${query}"`,
      config: {
        systemInstruction: "You are an elite mathematical assistant. Provide a structured JSON response including the final answer, a brief explanation, and step-by-step logic.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: "The concise final numerical or algebraic answer." },
            explanation: { type: Type.STRING, description: "A brief 1-2 sentence overview of the logic." },
            steps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "An array of logical steps taken to reach the answer."
            }
          },
          required: ["answer", "explanation", "steps"],
          propertyOrdering: ["answer", "explanation", "steps"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      answer: result.answer || "Error: No answer provided",
      explanation: result.explanation || "No explanation available.",
      steps: result.steps || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      answer: "Error",
      explanation: "Failed to connect to AI assistant.",
      steps: ["Please check your internet connection or API key."]
    };
  }
};
