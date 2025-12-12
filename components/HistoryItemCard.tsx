import React from 'react';
import { HistoryItem, SupportedLanguage } from '../types';
import { playTextToSpeech } from '../services/audioUtils';

interface HistoryItemCardProps {
  item: HistoryItem;
}

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item }) => {
  const isMandarinOrigin = item.detectedLanguage === SupportedLanguage.MANDARIN;
  
  const bubbleAlignment = isMandarinOrigin ? "justify-start" : "justify-end";
  
  // "Other person" bubble (left, grey) vs "Me" bubble (right, blue)
  const bubbleStyles = isMandarinOrigin 
    ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-2xl rounded-bl-none" 
    : "bg-blue-600 text-white rounded-2xl rounded-br-none";
    
  const tagClass = isMandarinOrigin
    ? "bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-200"
    : "bg-blue-500 text-blue-100";
    
  const playButtonColor = isMandarinOrigin 
    ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" 
    : "text-blue-200 hover:text-white";

  const metaTextColor = isMandarinOrigin ? 'text-slate-500 dark:text-slate-400' : 'text-blue-200';
  const originalTextColor = isMandarinOrigin ? 'text-slate-800 dark:text-slate-200' : 'text-white';
  const translatedTextColor = isMandarinOrigin ? 'text-slate-900 dark:text-slate-50' : 'text-white';
  const separatorColor = isMandarinOrigin ? 'border-slate-300 dark:border-slate-600' : 'border-blue-500';

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetLang = isMandarinOrigin ? 'Cantonese' : 'Mandarin';
    playTextToSpeech(item.translatedText, targetLang);
  };

  return (
    <div className={`w-full flex ${bubbleAlignment} animate-fade-in`}>
      <div className={`w-auto max-w-[85%] sm:max-w-[75%] p-4 ${bubbleStyles} shadow-md transition-all`}>
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tagClass}`}>
            {isMandarinOrigin ? "普通话" : "粤语"} &rarr; {isMandarinOrigin ? "粤语" : "普通话"}
          </span>
          <span className={`text-xs ${metaTextColor}`}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="mb-4">
          <p className={`text-sm mb-1 ${metaTextColor}`}>原文:</p>
          <p className={`font-medium text-lg leading-snug ${originalTextColor}`}>{item.originalText}</p>
        </div>

        <div className={`border-t pt-3 ${separatorColor}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm mb-1 ${metaTextColor}`}>译文:</p>
              <p className={`font-bold text-xl leading-snug ${translatedTextColor}`}>{item.translatedText}</p>
            </div>
            <button 
              onClick={handleReplay}
              className={`ml-4 p-2 rounded-full active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 ${isMandarinOrigin ? 'focus:ring-blue-500 dark:focus:ring-offset-slate-800' : 'focus:ring-white'} ${playButtonColor}`}
              aria-label="Play Translation"
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};