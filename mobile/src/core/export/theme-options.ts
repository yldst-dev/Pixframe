import { ThemeOption, ThemeOptionInput } from '../../pages/theme/types/theme-option';

export const resolveThemeOptions = (definitions: ThemeOption[], overrides: ThemeOptionInput): ThemeOptionInput => {
  const themeOptions: ThemeOptionInput = new Map();

  definitions.forEach((option) => {
    themeOptions.set(option.id, option.default);
  });

  overrides.forEach((value, key) => {
    if (definitions.some((option) => option.id === key)) {
      themeOptions.set(key, value);
    }
  });

  return themeOptions;
};
