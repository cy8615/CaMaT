import React from 'react';

interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  isDisabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({ 
  isRecording, 
  isProcessing, 
  duration, 
  isDisabled = false,
  onStart, 
  onStop 
}) => {
  
  const isButtonDisabled = isProcessing || isDisabled;

  // Calculate stroke dash for circular progress (Max 30s)
  const radius = 46; // Using a fixed radius for a 100x100 viewBox
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(duration / 30, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-center no-select">
      {/* Instructions */}
      <div className="mb-4 text-center h-6 font-medium">
         {isProcessing ? (
           <span className="text-blue-600 animate-pulse">正在翻译...</span>
         ) : isRecording ? (
           <span className="text-red-500">松开结束 • {30 - Math.floor(duration)}s</span>
         ) : isDisabled ? (
           <span className="text-yellow-600 dark:text-yellow-400">请允许麦克风权限</span>
         ) : (
           <span className="text-gray-500 dark:text-gray-400">按住说话</span>
         )}
      </div>

      {/* Grid container to perfectly center all layered elements */}
      <div className="relative grid place-items-center w-24 h-24 group">
        {/* Pulsing Effect when idle */}
        {!isRecording && !isButtonDisabled && (
          <div className="absolute w-20 h-20 rounded-full bg-slate-400 opacity-20 animate-pulse-slow group-hover:opacity-30 transition-opacity"></div>
        )}
        
        {/* Progress Ring */}
        <div className="absolute inset-0 pointer-events-none">
           <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
             <circle
               cx="50"
               cy="50"
               r={radius}
               stroke="currentColor"
               strokeWidth="6"
               fill="transparent"
               className="text-gray-200 dark:text-slate-700"
             />
             {isRecording && (
               <circle
                 cx="50"
                 cy="50"
                 r={radius}
                 stroke="currentColor"
                 strokeWidth="6"
                 fill="transparent"
                 strokeDasharray={circumference}
                 strokeDashoffset={strokeDashoffset}
                 className="text-red-500"
                 style={{ transition: 'stroke-dashoffset 0.1s linear' }}
               />
             )}
           </svg>
        </div>

        {/* The Main Button */}
        <button
          className={`
            col-start-1 row-start-1 z-10
            w-20 h-20 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 transform
            ${isRecording ? 'bg-red-500 scale-95 shadow-inner' : 'bg-slate-800 hover:bg-slate-900 group-hover:scale-105'}
            ${isButtonDisabled ? 'bg-slate-400 opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onMouseDown={isButtonDisabled ? undefined : onStart}
          onMouseUp={isButtonDisabled ? undefined : onStop}
          onMouseLeave={isButtonDisabled ? undefined : onStop}
          onTouchStart={(e) => {
            if (!isButtonDisabled) {
              e.preventDefault();
              onStart();
            }
          }}
          onTouchEnd={(e) => {
            if (!isButtonDisabled) {
              e.preventDefault();
              onStop();
            }
          }}
          disabled={isButtonDisabled}
        >
          {isProcessing ? (
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 text-white transition-transform duration-300 ${isRecording ? 'scale-110' : 'scale-100'}`}>
              <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
              <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75A.75.75 0 0 1 6 10.5Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};