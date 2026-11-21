import React from 'react';

export const Logo: React.FC<{ className?: string; showText?: boolean; variant?: 'inline' | 'stacked' }> = ({ 
  className = "", 
  showText = true,
  variant = 'inline'
}) => {
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-start ${className}`}>
        <svg
          viewBox="0 0 240 125"
          className="w-40 h-22 sm:w-48 sm:h-26 flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Yellow circuit nodes and traces matching reference */}
          <circle cx="22" cy="28" r="5" fill="#FBBF24" />
          <circle cx="22" cy="50" r="5" fill="#FBBF24" />
          <circle cx="22" cy="72" r="5" fill="#FBBF24" />
          
          <path d="M22 28H52L68 44" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M22 50H48" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M22 72H52L68 56" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
          
          <circle cx="52" cy="28" r="3.5" fill="#FBBF24" />
          <circle cx="52" cy="72" r="3.5" fill="#FBBF24" />

          {/* Stylized MA text in vibrant blue */}
          <path
            d="M38 80V30L60 62L82 30V80"
            stroke="#1d4ed8"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {showText && (
            <text
              x="36"
              y="110"
              fill="#0f172a"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="16.5"
              fontWeight="900"
              letterSpacing="3.5"
            >
              DIGITAL STORE
            </text>
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 160 90"
        className="w-12 h-10 sm:w-16 sm:h-12 flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="22" r="4" fill="#FBBF24" />
        <circle cx="16" cy="45" r="4" fill="#FBBF24" />
        <circle cx="16" cy="68" r="4" fill="#FBBF24" />
        
        <path d="M16 22H40L52 35" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 45H36" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 68H40L52 55" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />

        <path
          d="M32 74V28L50 52L68 28V74"
          stroke="#2563eb"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-blue-600 font-sans leading-none">
            MA
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-800 uppercase mt-0.5">
            DIGITAL STORE
          </span>
        </div>
      )}
    </div>
  );
};
