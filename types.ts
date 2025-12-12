export enum SupportedLanguage {
  MANDARIN = 'Mandarin',
  CANTONESE = 'Cantonese',
  UNKNOWN = 'Unknown'
}

export interface TranslationResult {
  detectedLanguage: SupportedLanguage;
  originalText: string;
  translatedText: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  detectedLanguage: SupportedLanguage;
  originalText: string;
  translatedText: string;
  audioBlob?: Blob; // Optional: Keep reference to original audio if needed
}

export interface AudioState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  duration: number;
}
