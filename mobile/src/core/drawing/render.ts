import Photo from '../photo';
import resize from './resize';
import { Store } from '../../store';
import { ThemeFunc } from './theme';
import { ThemeOptionInput } from '../../pages/theme/types/theme-option';
import { ensureFontsLoaded } from '../../fonts';

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

  if (themeName === 'Strap') {
    next.set('DARK_MODE', isDark);
    return next;
  }

  if (themeName === 'Monitor') {
    next.set('BACKGROUND_COLOR', isDark ? '#000000' : '#ffffff');
    next.set('TEXT_COLOR', isDark ? '#ffffff' : '#000000');
    return next;
  }

  if (isDark) {
    next.set('BACKGROUND_COLOR', '#000000');
    next.set('TEXT_COLOR', '#ffffff');
  }

  return next;
};

const collectRequiredFonts = (option: ThemeOptionInput): string[] => {
  const fonts = ['Barlow'];
  const fontFamily = option.get('FONT_FAMILY');
  if (typeof fontFamily === 'string' && fontFamily.trim().length > 0) {
    fonts.push(fontFamily);
  }
  return fonts;
};

const render = async (func: ThemeFunc, photo: Photo, option: ThemeOptionInput, store: Store): Promise<HTMLCanvasElement> => {
  const optionWithThemeDarkMode = applyThemeDarkMode(option, store);
  await ensureFontsLoaded(collectRequiredFonts(optionWithThemeDarkMode));

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
