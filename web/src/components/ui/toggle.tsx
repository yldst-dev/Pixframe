import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false,
  size = 'md'
}) => {
  const toggleSizes = {
    sm: {
      switch: 'w-8 h-5',
      thumb: 'w-3 h-3',
      translate: checked ? 'translate-x-3' : 'translate-x-0.5'
    },
    md: {
      switch: 'w-10 h-6',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-4' : 'translate-x-0.5'
    }
  };

  const currentSize = toggleSizes[size];

  return (
    <div className="flex items-start space-x-3" onClick={() => !disabled && onChange(!checked)}>
      <div className="relative flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          className={`
            relative inline-flex shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0
            ${checked 
              ? 'bg-primary border-primary' 
              : 'bg-input border-input'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${currentSize.switch}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block bg-background shadow-none
              transform ring-0 transition duration-200 ease-in-out
              ${currentSize.thumb} ${currentSize.translate}
              mt-[2px]
            `}
          />
        </button>
      </div>
      
      {(label || description) && (
        <div className="flex-1 min-w-0 cursor-pointer">
          {label && (
            <label className="block text-sm font-medium text-foreground cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 select-none">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;
