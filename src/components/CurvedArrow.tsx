import React from 'react';

interface UserGuideProps {
  className?: string;
  direction?: 'right' | 'left' | 'down' | 'up';
  animated?: boolean;
  text?: string;
}

export const CurvedArrow: React.FC<UserGuideProps> = ({ 
  className = '', 
  direction = 'right',
  animated = true,
  text = 'Try AI'
}) => {
  const getDirectionClasses = () => {
    switch(direction) {
      case 'left':
        return 'flex-row-reverse';
      case 'down':
        return 'flex-col';
      case 'up':
        return 'flex-col-reverse';
      default:
        return 'flex-row';
    }
  };

  const getArrowRotation = () => {
    switch(direction) {
      case 'left':
        return 'rotate-180';
      case 'down':
        return 'rotate-90';
      case 'up':
        return '-rotate-90';
      default:
        return '';
    }
  };

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div className={`relative inline-flex items-center gap-1.5 ${getDirectionClasses()}`}>
        {/* Premium Indicator */}
        <div className="relative flex items-center gap-2">
          {/* Pulsing Dot */}
          <div className="relative">
            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-lg" />
            {animated && (
              <div className="absolute inset-0 w-2 h-2 bg-orange-400 rounded-full animate-ping" />
            )}
          </div>
          
          {/* Animated Connecting Line */}
          <div className="relative w-10 h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent shadow-sm overflow-hidden">
            {animated && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 animate-[drawLine_1.5s_ease-in-out_infinite]"
                style={{
                  width: '100%',
                  transform: 'translateX(-100%)',
                }}
              />
            )}
          </div>
          
          {/* AI Badge */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 rounded-full shadow-lg border border-orange-400/30">
            <span className="text-xs font-semibold text-white whitespace-nowrap drop-shadow-sm">
              {text}
            </span>
          </div>
        </div>
        
        {/* Subtle Arrow Icon */}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          className={`text-primary/70 flex-shrink-0 ${getArrowRotation()}`}
        >
          <path
            d="M2 1.5l2.5 2.5L2 6.5"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};