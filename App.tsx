import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingButton } from './components/RecordingButton';
import { HistoryItemCard } from './components/HistoryItemCard';
import { HistoryItem, SupportedLanguage } from './types';
import { processAudioAndTranslate } from './services/geminiService';
import { blobToBase64, playTextToSpeech } from './services/audioUtils';

const App: React.FC = () => {
  // State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Check microphone permissions on load
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setMicPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          setMicPermission(permissionStatus.state);
        };
      });
    } else {
      // Fallback for older browsers
      setMicPermission('prompt');
    }
  }, []);

  // Scroll to bottom when history updates
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (micPermission === 'denied') {
      setErrorMsg("麦克风权限已被禁用，请在浏览器设置中启用。");
      return;
    }

    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 0.1;
        });
      }, 100);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      // This will catch if the user denies the permission prompt in real-time
      setErrorMsg("无法访问麦克风，请授予权限后重试。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecordingStop = async () => {
    // Release the microphone stream here, ensuring the recorder has finished.
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, {
       type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
    });

    if (audioBlob.size < 1000) return;

    setIsProcessing(true);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await processAudioAndTranslate(base64Audio, audioBlob.type);

      if (result.detectedLanguage === SupportedLanguage.UNKNOWN) {
        setErrorMsg("未能识别语音，请重试。");
      } else {
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          detectedLanguage: result.detectedLanguage,
          originalText: result.originalText,
          translatedText: result.translatedText,
          audioBlob: audioBlob
        };

        setHistory(prev => [...prev, newItem]);
        const targetLang = result.detectedLanguage === SupportedLanguage.MANDARIN ? 'Cantonese' : 'Mandarin';
        playTextToSpeech(result.translatedText, targetLang);
      }
    } catch (err) {
      console.error("Processing error:", err);
      setErrorMsg("翻译失败，请检查网络连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden dark:bg-slate-900 dark:text-slate-50">
      <header className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-3">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-500">
              <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03Z" />
              <path d="m3.422 8.132 8.518 4.969a.75.75 0 0 0 .12.062l.006.003.023.012a.75.75 0 0 0 .662 0l.023-.012.006-.003a.75.75 0 0 0 .12-.062l8.518-4.969V18a2.25 2.25 0 0 1-2.25 2.25h-13.5A2.25 2.25 0 0 1 3 18V8.132Z" />
            </svg>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">CantoMando</h1>
        </div>
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          普通话 ⇌ 粤语
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-2xl mx-auto scroll-smooth">
        {micPermission === 'denied' && (
           <div className="p-4 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-500 rounded-r-lg text-center mx-4 animate-fade-in">
            <p className="font-bold">麦克风权限已禁用</p>
            <p className="text-sm">请在浏览器地址栏左侧的设置中，为本网站启用麦克风权限。</p>
          </div>
        )}

        {history.length === 0 && !errorMsg && micPermission !== 'denied' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-6">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
             </svg>
            <p className="text-lg font-semibold text-slate-500 dark:text-slate-300">即时语音翻译</p>
            <p className="text-slate-400 mt-1">按住下方按钮，开始说普通话或粤语</p>
          </div>
        )}

        {history.map((item) => (
          <HistoryItemCard key={item.id} item={item} />
        ))}
        
        {errorMsg && (
          <div className="p-4 bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200 rounded-lg text-center mx-4 animate-fade-in">
            {errorMsg}
          </div>
        )}
        
        <div ref={scrollEndRef} className="h-4" />
      </main>

      <footer className="flex-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-4 pt-3">
        <div className="max-w-md mx-auto w-full flex justify-center">
          <RecordingButton 
            isRecording={isRecording} 
            isProcessing={isProcessing}
            duration={recordingDuration}
            isDisabled={micPermission === 'denied'}
            onStart={startRecording} 
            onStop={stopRecording} 
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
