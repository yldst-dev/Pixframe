import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import themes, { useThemeStore } from '../../themes';
import Button from '../ui/button';
import Slider from '../ui/slider';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { ThemeSettingsProps, NumberThemeOption, RangeSliderThemeOption, SelectThemeOption } from '../../types';

const AVAILABLE_TAGS = [
  'MAKER', 'BODY', 'LENS', 'ISO', 'MM', 'F', 'SEC', 'TAKEN_AT'
];

const TemplateBuilder: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasTag = (tag: string) => value.includes(`{${tag}}`);

  const insertTag = (tag: string) => {
    const input = inputRef.current;
    if (!input) {
      // Fallback if ref is missing (shouldn't happen)
      onChange(value + `{${tag}}`);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    
    const newValue = value.substring(0, start) + `{${tag}}` + value.substring(end);
    onChange(newValue);
    
    // Restore focus and move cursor after inserted tag
    setTimeout(() => {
      input.focus();
      const newCursorPos = start + tag.length + 2; // +2 for {} braces
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
      />
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => insertTag(tag)}
            className={`
              px-2 py-1 text-xs font-mono border transition-colors
              ${hasTag(tag)
                ? 'bg-secondary text-foreground border-input hover:bg-muted'
                : 'bg-background text-muted-foreground border-input hover:bg-secondary hover:text-foreground'
              }
            `}
            title="Click to insert"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isMobile = false }) => {
  const { t } = useTranslation();
  const { selectedThemeName, setSelectedThemeName } = useStore();
  const { option: themeOptions, setOption, replaceOptions } = useThemeStore();
  const selectedTheme = themes.find(theme => theme.name === selectedThemeName);

  // Local state to handle immediate UI updates while debouncing the actual store update
  const [localOptions, setLocalOptions] = React.useState<Map<string, string | number | boolean>>(new Map());

  const debouncedSetOption = useDebouncedCallback((key: string, value: string | number | boolean) => {
    setOption(key, value);
  }, 300);

  const handleOptionChange = useCallback((key: string, value: string | number | boolean) => {
    setLocalOptions(prev => {
      const newMap = new Map(prev);
      newMap.set(key, value);
      return newMap;
    });
    
    debouncedSetOption(key, value);
  }, [debouncedSetOption]);

  React.useEffect(() => {
    setLocalOptions(new Map());
  }, [selectedThemeName]);

  const getOptionValue = useCallback((optionId: string, defaultValue: string | number | boolean) => {
    if (localOptions.has(optionId)) {
      return localOptions.get(optionId);
    }
    return themeOptions.get(optionId) ?? defaultValue;
  }, [localOptions, themeOptions]);


  const handleThemeSelect = useCallback((themeName: string) => {
    setLocalOptions(new Map());
    setSelectedThemeName(themeName);
    
    const prevTheme = themes.find(theme => theme.name === selectedThemeName);
    const newTheme = themes.find(theme => theme.name === themeName);
    
    if (newTheme) {
      const prevOptionIds = prevTheme?.options.map(option => option.id) || [];
      const newThemeOptions = new Map();
      newTheme.options.forEach(option => {
        newThemeOptions.set(option.id, option.default);
      });
      replaceOptions(prevOptionIds, newThemeOptions);
    }
  }, [selectedThemeName, setSelectedThemeName, replaceOptions]);

  return (
    <div className="space-y-8 pb-8">
      {/* Theme Selection - Only show on Desktop */}
      {!isMobile && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t('theme.select', 'Select Theme')}
          </h3>
          
          <div className="grid grid-cols-1 gap-[-1px] border border-border bg-border">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeSelect(theme.name)}
                className={`
                  p-4 text-left transition-all relative border-b border-border last:border-b-0 bg-background
                  hover:bg-muted
                  ${selectedThemeName === theme.name
                    ? 'bg-secondary'
                    : ''
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-foreground uppercase tracking-tight">
                      {theme.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {t(`theme.${theme.name.toLowerCase()}.description`, 'Theme description')}
                    </div>
                  </div>
                  {selectedThemeName === theme.name && (
                    <div className="w-2 h-2 bg-primary" />
                  )}
                </div>
                {selectedThemeName === theme.name && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Theme Customization */}
      {selectedTheme && selectedTheme.options.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t('theme.customize', 'Customize')}
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (selectedTheme) {
                  setLocalOptions(new Map());
                  selectedTheme.options.forEach(opt => {
                    setOption(opt.id, opt.default);
                  });
                }
              }}
              className="text-xs uppercase"
            >
              {t('theme.reset', 'Reset')}
            </Button>
          </div>

          <div className="space-y-6">
            {selectedTheme.options.map((option, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                  {option.id}
                  {option.description && (
                    <span className="text-[10px] text-muted-foreground ml-2 font-normal normal-case">
                      {option.id === 'TEXT_ALPHA' 
                        ? t('theme.option.range.alpha', '(0-1)')
                        : option.id === 'FONT_WEIGHT'
                          ? t('theme.option.range.weight', '(100-900)')
                          : `(${option.description})`
                      }
                    </span>
                  )}
                </label>
                
                {option.type === 'color' && (
                  <div className="flex items-center space-x-2">
                    <div className="relative w-10 h-10 border border-border shrink-0">
                      <input
                        type="color"
                        value={getOptionValue(option.id, option.default) as string}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <div 
                        className="w-full h-full"
                        style={{ backgroundColor: getOptionValue(option.id, option.default) as string }}
                      />
                    </div>
                    <input
                      type="text"
                      value={getOptionValue(option.id, option.default) as string}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      placeholder={t('theme.option.color.placeholder', '#ffffff')}
                      className="flex-1 px-3 py-2 text-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                    />
                  </div>
                )}
                
                {option.type === 'number' && (
                  <input
                    type="number"
                    value={getOptionValue(option.id, option.default) as number}
                    onChange={(e) => handleOptionChange(option.id, Number(e.target.value))}
                    min={(option as NumberThemeOption).min}
                    max={(option as NumberThemeOption).max}
                    step={(option as NumberThemeOption).step}
                    placeholder={option.id.includes('FONT_SIZE') 
                      ? t('theme.option.number.font-size', 'px') 
                      : option.id.includes('PADDING') 
                        ? t('theme.option.number.padding', 'px')
                        : t('theme.option.number.default', 'Value')
                    }
                    className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                  />
                )}
                
                {(option.type === 'string') && (
                  <>
                    {option.id.startsWith('TEMPLATE') ? (
                      <TemplateBuilder
                        value={getOptionValue(option.id, option.default) as string}
                        onChange={(val) => handleOptionChange(option.id, val)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={getOptionValue(option.id, option.default) as string}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={option.id === 'TEXT' 
                          ? t('theme.option.text.custom', 'Enter text...')
                          : t('theme.option.string.placeholder', 'Enter text...')
                        }
                        className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                      />
                    )}
                  </>
                )}

                {option.type === 'range-slider' && (
                  <div className="flex items-center space-x-3">
                    <Slider
                      min={(option as RangeSliderThemeOption).min}
                      max={(option as RangeSliderThemeOption).max}
                      step={(option as RangeSliderThemeOption).step}
                      value={getOptionValue(option.id, option.default) as number}
                      onChange={(value) => handleOptionChange(option.id, value)}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-12 text-right">{getOptionValue(option.id, option.default) as number}</span>
                  </div>
                )}

                {option.type === 'select' && (option as SelectThemeOption).options && (
                   <select
                     value={getOptionValue(option.id, option.default) as string}
                     onChange={(e) => handleOptionChange(option.id, e.target.value)}
                     className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono appearance-none rounded-none"
                   >
                     {(option as SelectThemeOption).options.map((opt: string) => (
                       <option key={opt} value={opt}>{opt}</option>
                     ))}
                   </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSettings;
