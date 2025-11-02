import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getWeatherForecastFunctionDeclaration: FunctionDeclaration = {
  name: 'get_weather_forecast',
  description: 'Gets the current weather forecast for a specified location in India.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'The city or region in India, e.g., "Munnar", "Coorg".',
      },
    },
    required: ['location'],
  },
};

export function startChat(): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [getWeatherForecastFunctionDeclaration] }],
    },
  });
  return chat;
}
