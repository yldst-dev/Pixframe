enum Font {
  // Barlow는 index.html에서 로드합니다.
  Digital7 = 'digital-7',
  Poxel = 'poxel',
  DINAlternateBold = 'din-alternate-bold',
  Pretendard = 'pretendard',
}

// Load all fonts from the fonts public/fonts folder
Object.values(Font).forEach((font) => new FontFace(font, `url(fonts/${font}.ttf)`).load().then((loadedFont) => document.fonts.add(loadedFont)));

export default Font;
