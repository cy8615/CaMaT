/**
 * Converts a Blob to a Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data-URL declaration (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Plays text using the browser's SpeechSynthesis API.
 * Attempts to select the correct voice for Mandarin (zh-CN) or Cantonese (zh-HK).
 */
export const playTextToSpeech = (text: string, language: 'Mandarin' | 'Cantonese') => {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find specific voices
  const voices = window.speechSynthesis.getVoices();
  
  let targetLangCode = 'zh-CN'; // Default to Mandarin
  if (language === 'Cantonese') {
    targetLangCode = 'zh-HK';
  }

  utterance.lang = targetLangCode;

  // Attempt to match a voice
  const preferredVoice = voices.find(v => v.lang === targetLangCode);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
};
