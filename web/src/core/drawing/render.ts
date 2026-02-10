import Photo from '../photo';
import resize from './resize';
import { Store } from '../../store';
import { ThemeFunc } from './theme';
import { ThemeOptionInput } from '../../pages/theme/types/theme-option';

const THEME_DARK_MODE_SUPPORTED_THEMES = new Set<string>([
  'Just frame',
  'Simple',
  'Strap',
  'One line',
  'Two line',
  'Shot on one line',
  'Shot on two line',
  'Monitor',
]);

const applyThemeDarkMode = (option: ThemeOptionInput, store: Store): ThemeOptionInput => {
  const themeName = store.selectedThemeName;
  if (!themeName || !THEME_DARK_MODE_SUPPORTED_THEMES.has(themeName)) return option;

  const isDark = Boolean(store.themeDarkMode);
  const next = new Map(option) as ThemeOptionInput;

  // Strap uses a boolean option to control background/text/logo variants.
  // Always sync it to the global toggle so local Strap dark mode doesn't conflict.
  if (themeName === 'Strap') {
    next.set('DARK_MODE', isDark);
    return next;
  }

  // Monitor is dark by default; treat the global toggle as a true light/dark switch.
  if (themeName === 'Monitor') {
    next.set('BACKGROUND_COLOR', isDark ? '#000000' : '#ffffff');
    next.set('TEXT_COLOR', isDark ? '#ffffff' : '#000000');
    return next;
  }

  // For other supported themes, only force black/white when dark mode is enabled.
  // When disabled, keep theme defaults/customizations intact.
  if (isDark) {
    next.set('BACKGROUND_COLOR', '#000000');
    next.set('TEXT_COLOR', '#ffffff');
  }

  return next;
};

const render = async (func: ThemeFunc, photo: Photo, option: ThemeOptionInput, store: Store): Promise<HTMLCanvasElement> => {
  const optionWithThemeDarkMode = applyThemeDarkMode(option, store);
  let canvas = func(photo, optionWithThemeDarkMode, store);

  if (store.fixWatermark && store.watermark) {
    const context = canvas.getContext('2d')!;
    const fontSize = 100;
    context.fillStyle = '#ffffff';
    context.shadowColor = '#000000';
    context.shadowBlur = 10;
    context.lineWidth = 5;
    context.font = `normal 500 ${fontSize}px Barlow`;
    context.textAlign = 'right';
    context.textBaseline = 'bottom';
    context.fillText(store.watermark, canvas.width - fontSize / 2, canvas.height - fontSize / 2);
    context.shadowBlur = 0;
  }

  if (store.enableFixImageWidth && store.fixImageWidth) {
    if (canvas.width > canvas.height) {
      const targetWidth = store.fixImageWidth > 4096 ? 4096 : store.fixImageWidth;
      const targetHeight = (targetWidth * canvas.height) / canvas.width;
      canvas = resize(canvas, targetWidth, targetHeight);
    } else {
      const targetHeight = store.fixImageWidth > 4096 ? 4096 : store.fixImageWidth;
      const targetWidth = (targetHeight * canvas.width) / canvas.height;
      canvas = resize(canvas, targetWidth, targetHeight);
    }
  }

  return canvas;
};

export default render;
