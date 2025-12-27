
import { GoogleGenAI } from "@google/genai";

// Use a service function to get suggestions, ensuring the AI client is initialized with the current environment's API key.
export const getTaipeiSuggestions = async (context: string) => {
  try {
    // Re-initialize the client inside the function to pick up the most current API key from the environment.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Taipei local expert. Suggest 3 must-eat hidden gems or activities in Taipei based on this context: "${context}". Return the response in Traditional Chinese (Hong Kong/Taiwan style). Keep it short and enthusiastic.`,
    });
    // The .text property directly returns the generated string. Handle undefined.
    return response.text || "暫時無法獲取建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "暫時無法獲取建議，請檢查網絡連線。";
  }
};
