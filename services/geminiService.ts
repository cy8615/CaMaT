import { GoogleGenAI, Type } from "@google/genai";
import { SupportedLanguage, TranslationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a highly skilled simultaneous interpreter specializing in Mandarin (Putonghua) and Cantonese.
Your task is to analyze the provided audio input.
1. Transcribe the audio exactly as spoken.
2. Detect whether the speaker is speaking Mandarin or Cantonese.
3. Translate the content to the OTHER language (if Mandarin -> translate to Cantonese; if Cantonese -> translate to Mandarin).
4. Return the result in a strict JSON format.
If the audio is unintelligible or silence, return 'Unknown' for language and empty strings.
`;

export const processAudioAndTranslate = async (base64Audio: string, mimeType: string = 'audio/webm'): Promise<TranslationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Listen to this audio. Transcribe it, detect if it is Mandarin or Cantonese, and translate it to the other."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              enum: [SupportedLanguage.MANDARIN, SupportedLanguage.CANTONESE, SupportedLanguage.UNKNOWN],
              description: "The language detected in the audio."
            },
            originalText: {
              type: Type.STRING,
              description: "The transcription of the original audio."
            },
            translatedText: {
              type: Type.STRING,
              description: "The translation of the text into the target language."
            }
          },
          required: ["detectedLanguage", "originalText", "translatedText"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TranslationResult;
    } else {
      throw new Error("No response text from Gemini");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
