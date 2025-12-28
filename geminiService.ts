
import { GoogleGenAI } from "@google/genai";

export const getTaipeiSuggestions = async (context: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Taipei local expert. Suggest 3 must-eat hidden gems or activities in Taipei based on this context: "${context}". Return the response in Traditional Chinese (Hong Kong/Taiwan style). Keep it short and enthusiastic.`,
    });
    return response.text || "暫時無法獲取建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "暫時無法獲取建議，請檢查網絡連線。";
  }
};

export const fetchFlightStatus = async (flightNumber: string, date: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Find the real-time flight status for flight "${flightNumber}" on ${date}. 
    I need:
    1. Scheduled Arrival Time (ETA)
    2. Terminal
    3. Gate
    Please return the information in a concise format like: "ETA: 10:30 AM, Terminal: 1, Gate: B7". 
    If not found, say "No real-time info found". Respond in English for data accuracy.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "No data available";
  } catch (error) {
    console.error("Flight Search Error:", error);
    return "Error fetching flight data";
  }
};
