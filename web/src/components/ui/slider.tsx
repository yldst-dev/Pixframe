import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInteract = useCallback((clientX: number) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    let newValue = min + percentage * (max - min);
    
    if (step) {
      const steps = Math.round((newValue - min) / step);
      newValue = min + steps * step;
    }
    
    newValue = Math.max(min, Math.min(max, newValue));
    
    if (step < 1) {
      const decimals = step.toString().split('.')[1]?.length || 0;
      newValue = parseFloat(newValue.toFixed(decimals));
    }

    onChange(newValue);
  }, [disabled, max, min, onChange, step]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteract(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteract(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteract(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleInteract(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleInteract, isDragging]);

  const thumbInset = 10;

  return (
    <div 
      className={`relative h-6 flex items-center select-none touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div ref={trackRef} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-75 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div 
        className={`absolute w-5 h-5 bg-white dark:bg-gray-100 border-2 border-primary rounded-full shadow hover:scale-110 transition-transform duration-75 ${isDragging ? 'scale-110' : ''}`}
        style={{ 
          left: `clamp(${thumbInset}px, calc(${percentage}% ), calc(100% - ${thumbInset}px))`,
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
};

export default Slider;
