
import { GoogleGenAI, Type } from "@google/genai";

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
    I need to know the ETA, Terminal, and Gate. If any info is not yet assigned, leave it empty or "TBD".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eta: { type: Type.STRING, description: "Estimated time of arrival, e.g., 10:30 AM" },
            terminal: { type: Type.STRING, description: "Terminal number/name" },
            gate: { type: Type.STRING, description: "Gate number" },
            summary: { type: Type.STRING, description: "Short summary of status" }
          },
          required: ["eta", "terminal", "gate"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Flight Search Error:", error);
    return { eta: "", terminal: "", gate: "", summary: "Error fetching data" };
  }
};

export const fetchTaipeiWeather = async (date: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide the weather forecast for Taipei on ${date}, 2025. 
    Return typical temperature and condition for late Dec/early Jan if specific forecast is unavailable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temp: { type: Type.STRING },
            condition: { type: Type.STRING },
            icon: { type: Type.STRING, description: "An emoji representing the weather" }
          },
          required: ["temp", "condition", "icon"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Weather Error:", error);
    return { temp: "18°C", condition: "陰", icon: "☁️" };
  }
};
