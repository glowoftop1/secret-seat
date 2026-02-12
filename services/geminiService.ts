
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedClassData } from "../types";

export const generateSampleClassData = async (count: number): Promise<GeneratedClassData> => {
  // Always use a new instance with the current process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a creative assistant. Generate a fun, fictional class list for a seating arrangement app.
    Theme: Use characters from a specific theme (e.g., Harry Potter, Marvel, Disney, K-Pop Idols, or Historical Figures).
    Output:
    1. A list of exactly ${count} names.
    2. A list of 5-8 pairs of students who should NOT sit together (rivals, enemies, or chatty best friends).
    Ensure the names are recognizable.
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-flash-preview for basic text and structuring tasks
      model: "gemini-3-flash-preview",
      contents: `Generate a class of ${count} students with some funny conflicts.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `List of ${count} student names`
            },
            conflicts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of pairs separated by comma, e.g. 'Tom, Jerry'"
            }
          },
          required: ["names", "conflicts"]
        }
      }
    });

    // Access .text property directly (not a method)
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedClassData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
