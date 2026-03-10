import '@fontsource/barlow/100.css';
import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/900.css';

enum Font {
  Digital7 = 'digital-7',
  Poxel = 'poxel',
  DINAlternateBold = 'din-alternate-bold',
  Pretendard = 'pretendard',
}

const localFontUrls: Record<string, string> = {
  [Font.Digital7]: '/fonts/digital-7.ttf',
  [Font.Poxel]: '/fonts/poxel.ttf',
  [Font.DINAlternateBold]: '/fonts/din-alternate-bold.ttf',
  [Font.Pretendard]: '/fonts/pretendard.ttf',
};

const fontLoadCache = new Map<string, Promise<void>>();

const normalizeFontFamily = (fontFamily: string): string => {
  const firstFamily = fontFamily.split(',')[0]?.trim() || '';
  return firstFamily.replace(/^['"]|['"]$/g, '');
};

const withTimeout = async (promise: Promise<unknown>, timeoutMs = 1200): Promise<void> => {
  await Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
};

const loadLocalFont = async (fontFamily: string): Promise<void> => {
  const src = localFontUrls[fontFamily];
  if (!src) {
    return;
  }

  const face = new FontFace(fontFamily, `url(${src}) format('truetype')`);
  const loadedFace = await face.load();
  document.fonts.add(loadedFace);
};

const waitFontReady = async (fontFamily: string): Promise<void> => {
  await withTimeout(
    Promise.all([
      document.fonts.load(`100 16px "${fontFamily}"`),
      document.fonts.load(`300 16px "${fontFamily}"`),
      document.fonts.load(`400 16px "${fontFamily}"`),
      document.fonts.load(`500 16px "${fontFamily}"`),
      document.fonts.load(`700 16px "${fontFamily}"`),
      document.fonts.load(`900 16px "${fontFamily}"`),
    ])
  );
};

const ensureFontLoaded = async (fontFamilyRaw: string): Promise<void> => {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }

  const fontFamily = normalizeFontFamily(fontFamilyRaw);
  if (!fontFamily) {
    return;
  }

  const cached = fontLoadCache.get(fontFamily);
  if (cached) {
    return cached;
  }

  const task = (async () => {
    await loadLocalFont(fontFamily).catch(() => undefined);
    await waitFontReady(fontFamily).catch(() => undefined);
  })();

  fontLoadCache.set(fontFamily, task);
  await task;
};

const ensureFontsLoaded = async (fontFamilies: string[]): Promise<void> => {
  await Promise.all(fontFamilies.map((fontFamily) => ensureFontLoaded(fontFamily)));
};

void ensureFontsLoaded(['Barlow', ...Object.values(Font)]);

export { ensureFontLoaded, ensureFontsLoaded };
export default Font;
