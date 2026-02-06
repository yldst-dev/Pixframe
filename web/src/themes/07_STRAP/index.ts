import Photo from '../../core/photo';
import { Store } from '../../store';
import sandbox from '../../core/drawing/sandbox';
import { ThemeFunc } from '../../core/drawing/theme';
import { ThemeOption, ThemeOptionInput } from '../../pages/theme/types/theme-option';
import overrideExifMetadata from '../../core/exif-metadata/override-exif-metadata';

const supportLogo = new Map<string, HTMLImageElement>();

const loadLogo = (pathname: string): HTMLImageElement => {
  const image = new Image();
  image.src = pathname;
  return image;
};

supportLogo.set('APPLE_LIGHT', loadLogo('/maker/light/apple.png'));
supportLogo.set('APPLE_DARK', loadLogo('/maker/dark/apple.png'));
supportLogo.set('CANON_LIGHT', loadLogo('/maker/light/canon.png'));
supportLogo.set('CANON_DARK', loadLogo('/maker/dark/canon.png'));
supportLogo.set('CONTAX_LIGHT', loadLogo('/maker/light/contax.png'));
supportLogo.set('CONTAX_DARK', loadLogo('/maker/dark/contax.png'));
supportLogo.set('DJI_LIGHT', loadLogo('/maker/light/dji.png'));
supportLogo.set('DJI_DARK', loadLogo('/maker/dark/dji.png'));
supportLogo.set('EPSON_LIGHT', loadLogo('/maker/light/epson.png'));
supportLogo.set('EPSON_DARK', loadLogo('/maker/dark/epson.png'));
supportLogo.set('FUJI_LIGHT', loadLogo('/maker/light/fujifilm.png'));
supportLogo.set('FUJI_DARK', loadLogo('/maker/dark/fujifilm.png'));
supportLogo.set('GOLDSTAR_LIGHT', loadLogo('/maker/light/goldstar.png'));
supportLogo.set('GOLDSTAR_DARK', loadLogo('/maker/dark/goldstar.png'));
supportLogo.set('HASSELBLAD_LIGHT', loadLogo('/maker/light/hasselblad.png'));
supportLogo.set('HASSELBLAD_DARK', loadLogo('/maker/dark/hasselblad.png'));
supportLogo.set('LEICA_LIGHT', loadLogo('/maker/light/leica.png'));
supportLogo.set('LEICA_DARK', loadLogo('/maker/dark/leica.png'));
supportLogo.set('LG_LIGHT', loadLogo('/maker/light/lg.png'));
supportLogo.set('LG_DARK', loadLogo('/maker/dark/lg.png'));
supportLogo.set('MAMIYA_LIGHT', loadLogo('/maker/light/mamiya.png'));
supportLogo.set('MAMIYA_DARK', loadLogo('/maker/dark/mamiya.png'));
supportLogo.set('NIKON_LIGHT', loadLogo('/maker/light/nikon.png'));
supportLogo.set('NIKON_DARK', loadLogo('/maker/dark/nikon.png'));
supportLogo.set('OLYMPUS_LIGHT', loadLogo('/maker/light/olympus.png'));
supportLogo.set('OLYMPUS_DARK', loadLogo('/maker/dark/olympus.png'));
supportLogo.set('OM_LIGHT', loadLogo('/maker/light/om.png'));
supportLogo.set('OM_DARK', loadLogo('/maker/dark/om.png'));
supportLogo.set('PANASONIC_LIGHT', loadLogo('/maker/light/lumix.png'));
supportLogo.set('PANASONIC_DARK', loadLogo('/maker/dark/lumix.png'));
supportLogo.set('PENTAX_LIGHT', loadLogo('/maker/light/pentax.png'));
supportLogo.set('PENTAX_DARK', loadLogo('/maker/dark/pentax.png'));
supportLogo.set('PHASEONE_LIGHT', loadLogo('/maker/light/phaseone.png'));
supportLogo.set('PHASEONE_DARK', loadLogo('/maker/dark/phaseone.png'));
supportLogo.set('RICOH_LIGHT', loadLogo('/maker/light/ricoh.png'));
supportLogo.set('RICOH_DARK', loadLogo('/maker/dark/ricoh.png'));
supportLogo.set('SAMSUNG_LIGHT', loadLogo('/maker/light/samsung.png'));
supportLogo.set('SAMSUNG_DARK', loadLogo('/maker/dark/samsung.png'));
supportLogo.set('SIGMA_LIGHT', loadLogo('/maker/light/sigma.png'));
supportLogo.set('SIGMA_DARK', loadLogo('/maker/dark/sigma.png'));
supportLogo.set('SONY_LIGHT', loadLogo('/maker/light/sony.png'));
supportLogo.set('SONY_DARK', loadLogo('/maker/dark/sony.png'));

const STRAP_OPTIONS: ThemeOption[] = [
  { id: 'ARTIST', type: 'string', default: '', description: 'your name' },
  { id: 'DARK_MODE', type: 'boolean', default: false, description: 'enable to use dark mode' },
  { id: 'SECONDARY_TEXT_FONT_WEIGHT', type: 'range-slider', min: 100, max: 900, step: 100, default: 300, description: '100 - 900' },
  { id: 'PADDING_TOP', type: 'number', default: 0, description: 'px' },
  { id: 'PADDING_BOTTOM', type: 'number', default: 0, description: 'px' },
  { id: 'PADDING_LEFT', type: 'number', default: 0, description: 'px' },
  { id: 'PADDING_RIGHT', type: 'number', default: 0, description: 'px' },
  { id: 'TEMPLATE1', type: 'string', default: '{ISO}{MM}{F}{SEC}' },
  { id: 'TEMPLATE2', type: 'string', default: '{MAKER}{BODY}' },
  { id: 'TEMPLATE3', type: 'string', default: '{TAKEN_AT}' },
  { id: 'TEMPLATE4', type: 'string', default: '{LENS}' },
];

const STRAP_FUNC: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: Store) => {
  const ARTIST = (input.get('ARTIST') as string).trim();
  const DARK_MODE = input.get('DARK_MODE') as boolean;
  const SECONDARY_TEXT_FONT_WEIGHT = input.get('SECONDARY_TEXT_FONT_WEIGHT') as number;
  const PADDING_TOP = input.get('PADDING_TOP') as number;
  const PADDING_BOTTOM = (input.get('PADDING_BOTTOM') as number) + 300;
  const PADDING_LEFT = input.get('PADDING_LEFT') as number;
  const PADDING_RIGHT = input.get('PADDING_RIGHT') as number;
  const TEMPLATE1 = (input.get('TEMPLATE1') as string).trim();
  const TEMPLATE2 = (input.get('TEMPLATE2') as string).trim();
  const TEMPLATE3 = (input.get('TEMPLATE3') as string).trim();
  const TEMPLATE4 = (input.get('TEMPLATE4') as string).trim();
  const FONT_SIZE = 70;
  const BACKGROUND_COLOR = DARK_MODE ? '#000000' : '#ffffff';
  const PRIMARY_TEXT_COLOR = DARK_MODE ? '#ffffff' : '#000000';
  const SECONDARY_TEXT_COLOR = DARK_MODE ? '#888888' : '#333333';

  const text1 = TEMPLATE1.split('}')
    .map((part) => `${part}}`)
    .map((part) =>
      part
        .replace(/{MAKER}/g, photo.make)
        .replace(/{BODY}/g, photo.model || '')
        .replace(/{LENS}/g, photo.lensModel || '')
        .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
        .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
        .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
        .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
        .replace(/{TAKEN_AT}/g, photo.takenAt || '')
        .replace(/}/g, '')
    )
    .filter(Boolean)
    .join(' ');

  const text2 = TEMPLATE2.split('}')
    .map((part) => `${part}}`)
    .map((part) =>
      part
        .replace(/{MAKER}/g, photo.make)
        .replace(/{BODY}/g, photo.model || '')
        .replace(/{LENS}/g, photo.lensModel || '')
        .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
        .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
        .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
        .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
        .replace(/{TAKEN_AT}/g, photo.takenAt || '')
        .replace(/}/g, '')
    )
    .filter(Boolean)
    .join(' ');

  const text3 = TEMPLATE3.split('}')
    .map((part) => `${part}}`)
    .map((part) =>
      part
        .replace(/{MAKER}/g, photo.make)
        .replace(/{BODY}/g, photo.model || '')
        .replace(/{LENS}/g, photo.lensModel || '')
        .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
        .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
        .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
        .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
        .replace(/{TAKEN_AT}/g, photo.takenAt || '')
        .replace(/}/g, '')
    )
    .filter(Boolean)
    .join(' ');

  const text4 = TEMPLATE4.split('}')
    .map((part) => `${part}}`)
    .map((part) =>
      part
        .replace(/{MAKER}/g, photo.make)
        .replace(/{BODY}/g, photo.model || '')
        .replace(/{LENS}/g, photo.lensModel || '')
        .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
        .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
        .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
        .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
        .replace(/{TAKEN_AT}/g, photo.takenAt || '')
        .replace(/}/g, '')
    )
    .filter(Boolean)
    .join(' ');

  const canvas = sandbox(photo, {
    targetRatio: store.ratio,
    notCroppedMode: store.notCroppedMode,
    backgroundColor: BACKGROUND_COLOR,
    padding: { top: PADDING_TOP, right: PADDING_RIGHT, bottom: PADDING_BOTTOM, left: PADDING_LEFT },
  });
  const context = canvas.getContext('2d')!;
  context.textBaseline = 'middle';
  const topLineY = canvas.height - PADDING_BOTTOM / 2 - FONT_SIZE / 2;
  const bottomLineY = canvas.height - PADDING_BOTTOM / 2 + FONT_SIZE / 2;

  context.textAlign = 'left';

  context.font = `normal 500 ${FONT_SIZE}px Barlow`;
  context.fillStyle = PRIMARY_TEXT_COLOR;
  const leftPrimaryText = store.disableExposureMeter ? '' : text1;

  if (!store.disableExposureMeter) {
    context.fillText(text1, FONT_SIZE, topLineY);
  }
  const leftPrimaryWidth = leftPrimaryText ? context.measureText(leftPrimaryText).width : 0;

  const leftSecondaryText = ARTIST ? `Shot by © ${ARTIST}` : text3;
  if (ARTIST) {
    context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;
    context.fillStyle = SECONDARY_TEXT_COLOR;
    context.fillText(leftSecondaryText, FONT_SIZE, bottomLineY);
  } else {
    context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;
    context.fillStyle = SECONDARY_TEXT_COLOR;
    context.fillText(leftSecondaryText, FONT_SIZE, bottomLineY);
  }
  const leftSecondaryWidth = leftSecondaryText ? context.measureText(leftSecondaryText).width : 0;
  const leftWidth = Math.max(leftPrimaryWidth, leftSecondaryWidth);

  let TARGET_LOGO_HEIGHT = FONT_SIZE * 2;
  const TARGET_LOGO_WIDTH = 400;
  let logo: HTMLImageElement | undefined;
  const maker = overrideExifMetadata()?.make || photo.metadata.make;
  const model = overrideExifMetadata()?.model || photo.metadata.model;

  if (maker?.toUpperCase().includes('APPLE') || model?.toUpperCase().includes('APPLE')) {
    logo = DARK_MODE ? supportLogo.get('APPLE_DARK') : supportLogo.get('APPLE_LIGHT');
  }

  if (maker?.toUpperCase().includes('CANON') || model?.toUpperCase().includes('CANON')) {
    logo = DARK_MODE ? supportLogo.get('CANON_DARK') : supportLogo.get('CANON_LIGHT');
  }

  if (maker?.toUpperCase().includes('CONTAX') || model?.toUpperCase().includes('CONTAX')) {
    logo = DARK_MODE ? supportLogo.get('CONTAX_DARK') : supportLogo.get('CONTAX_LIGHT');
  }

  if (maker?.toUpperCase().includes('DJI') || model?.toUpperCase().includes('DJI')) {
    logo = DARK_MODE ? supportLogo.get('DJI_DARK') : supportLogo.get('DJI_LIGHT');
  }

  if (maker?.toUpperCase().includes('EPSON') || model?.toUpperCase().includes('EPSON')) {
    logo = DARK_MODE ? supportLogo.get('EPSON_DARK') : supportLogo.get('EPSON_LIGHT');
  }

  if (maker?.toUpperCase().includes('FUJI') || model?.toUpperCase().includes('FUJI')) {
    logo = DARK_MODE ? supportLogo.get('FUJI_DARK') : supportLogo.get('FUJI_LIGHT');
  }

  if (maker?.toUpperCase().includes('GOLDSTAR') || model?.toUpperCase().includes('GOLDSTAR')) {
    logo = DARK_MODE ? supportLogo.get('GOLDSTAR_DARK') : supportLogo.get('GOLDSTAR_LIGHT');
  }

  if (maker?.toUpperCase().includes('HASSELBLAD') || model?.toUpperCase().includes('HASSELBLAD')) {
    logo = DARK_MODE ? supportLogo.get('HASSELBLAD_DARK') : supportLogo.get('HASSELBLAD_LIGHT');
  }

  if (maker?.toUpperCase().includes('LEICA') || model?.toUpperCase().includes('LEICA')) {
    logo = DARK_MODE ? supportLogo.get('LEICA_DARK') : supportLogo.get('LEICA_LIGHT');
  }

  if (maker?.toUpperCase().includes('LG') || model?.toUpperCase().includes('LG')) {
    logo = DARK_MODE ? supportLogo.get('LG_DARK') : supportLogo.get('LG_LIGHT');
  }

  if (maker?.toUpperCase().includes('MAMIYA') || model?.toUpperCase().includes('MAMIYA')) {
    logo = DARK_MODE ? supportLogo.get('MAMIYA_DARK') : supportLogo.get('MAMIYA_LIGHT');
  }

  if (maker?.toUpperCase().includes('NIKON') || model?.toUpperCase().includes('NIKON')) {
    logo = DARK_MODE ? supportLogo.get('NIKON_DARK') : supportLogo.get('NIKON_LIGHT');
  }

  if (maker?.toUpperCase().includes('OLYMPUS') || model?.toUpperCase().includes('OLYMPUS')) {
    logo = DARK_MODE ? supportLogo.get('OLYMPUS_DARK') : supportLogo.get('OLYMPUS_LIGHT');
  }

  if (maker?.toUpperCase().includes('OM') || model?.toUpperCase().includes('OM')) {
    logo = DARK_MODE ? supportLogo.get('OM_DARK') : supportLogo.get('OM_LIGHT');
  }

  if (maker?.toUpperCase().includes('PANASONIC') || model?.toUpperCase().includes('PANASONIC')) {
    logo = DARK_MODE ? supportLogo.get('PANASONIC_DARK') : supportLogo.get('PANASONIC_LIGHT');
  }

  if (maker?.toUpperCase().includes('PHASE') || model?.toUpperCase().includes('PHASE')) {
    logo = DARK_MODE ? supportLogo.get('PHASEONE_DARK') : supportLogo.get('PHASEONE_LIGHT');
  }

  if (maker?.toUpperCase().includes('RICO') || model?.toUpperCase().includes('RICO')) {
    logo = DARK_MODE ? supportLogo.get('RICOH_DARK') : supportLogo.get('RICOH_LIGHT');
  }

  if (maker?.toUpperCase().includes('PENTAX') || model?.toUpperCase().includes('PENTAX')) {
    logo = DARK_MODE ? supportLogo.get('PENTAX_DARK') : supportLogo.get('PENTAX_LIGHT');
  }

  if (maker?.toUpperCase().includes('SIGMA') || model?.toUpperCase().includes('SIGMA')) {
    logo = DARK_MODE ? supportLogo.get('SIGMA_DARK') : supportLogo.get('SIGMA_LIGHT');
  }

  if (maker?.toUpperCase().includes('SONY') || model?.toUpperCase().includes('SONY')) {
    logo = DARK_MODE ? supportLogo.get('SONY_DARK') : supportLogo.get('SONY_LIGHT');
  }

  if (maker?.toUpperCase().includes('SAMSUNG') || model?.toUpperCase().includes('SAMSUNG')) {
    logo = DARK_MODE ? supportLogo.get('SAMSUNG_DARK') : supportLogo.get('SAMSUNG_LIGHT');
  }

  context.textAlign = 'right';

  context.fillStyle = PRIMARY_TEXT_COLOR;
  context.font = `normal 500 ${FONT_SIZE}px Barlow`;
  let makerModelText = text2;
  let topWidth = makerModelText ? context.measureText(makerModelText).width : 0;

  context.fillStyle = SECONDARY_TEXT_COLOR;
  context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;
  const lensModelText = text4;
  let bottomWidth = lensModelText ? context.measureText(lensModelText).width : 0;

  let rightWidth = Math.max(topWidth, bottomWidth);
  let rightBlockLeft = canvas.width - FONT_SIZE - rightWidth;
  let maxLogoRight = rightBlockLeft - FONT_SIZE * 2;
  const minLogoLeft = FONT_SIZE + leftWidth + FONT_SIZE;
  let availableLogoWidth = maxLogoRight - minLogoLeft;

  if (logo && availableLogoWidth <= 0) {
    const compactModelText = (photo.model || '').trim();
    if (compactModelText && compactModelText !== makerModelText) {
      makerModelText = compactModelText;
      context.font = `normal 500 ${FONT_SIZE}px Barlow`;
      topWidth = context.measureText(makerModelText).width;
      rightWidth = Math.max(topWidth, bottomWidth);
      rightBlockLeft = canvas.width - FONT_SIZE - rightWidth;
      maxLogoRight = rightBlockLeft - FONT_SIZE * 2;
      availableLogoWidth = maxLogoRight - minLogoLeft;
    }
    if (availableLogoWidth <= 0) {
      makerModelText = '';
      topWidth = 0;
      rightWidth = Math.max(topWidth, bottomWidth);
      rightBlockLeft = canvas.width - FONT_SIZE - rightWidth;
      maxLogoRight = rightBlockLeft - FONT_SIZE * 2;
      availableLogoWidth = maxLogoRight - minLogoLeft;
    }
  }

  // If there is no horizontal room between the left/right text blocks, we will draw the logo in a
  // fallback position (top-right). In that mode, keep the top-right text empty so the logo doesn't
  // paint over the maker/model line (common on narrow portrait exports).
  const useFallbackLogoPlacement = Boolean(logo) && availableLogoWidth <= 0;
  if (useFallbackLogoPlacement && makerModelText) {
    makerModelText = '';
    topWidth = 0;
    rightWidth = Math.max(topWidth, bottomWidth);
    rightBlockLeft = canvas.width - FONT_SIZE - rightWidth;
    maxLogoRight = rightBlockLeft - FONT_SIZE * 2;
    availableLogoWidth = maxLogoRight - minLogoLeft;
  }

  context.fillStyle = PRIMARY_TEXT_COLOR;
  context.font = `normal 500 ${FONT_SIZE}px Barlow`;
  if (makerModelText) {
    context.fillText(makerModelText, canvas.width - FONT_SIZE, topLineY);
  }

  context.fillStyle = SECONDARY_TEXT_COLOR;
  context.font = `normal ${SECONDARY_TEXT_FONT_WEIGHT} ${FONT_SIZE}px Barlow`;
  if (lensModelText) {
    context.fillText(lensModelText, canvas.width - FONT_SIZE, bottomLineY);
  }

  const hasRightText = Boolean(makerModelText || lensModelText);
  const dividerX = rightBlockLeft - FONT_SIZE;
  if (hasRightText) {
    context.beginPath();
    context.moveTo(dividerX, topLineY - FONT_SIZE / 2);
    context.lineTo(dividerX, bottomLineY + FONT_SIZE / 2);
    context.strokeStyle = SECONDARY_TEXT_COLOR;
    context.lineWidth = 2;
    context.stroke();
  }

  if (logo) {
    if (availableLogoWidth > 0) {
      let LOGO_WIDTH = (logo.width / logo.height) * TARGET_LOGO_HEIGHT;
      const maxLogoWidth = Math.min(TARGET_LOGO_WIDTH, availableLogoWidth);
      if (LOGO_WIDTH > maxLogoWidth) {
        LOGO_WIDTH = maxLogoWidth;
        TARGET_LOGO_HEIGHT = (logo.height / logo.width) * LOGO_WIDTH;
      }
      context.drawImage(
        logo,
        maxLogoRight - LOGO_WIDTH,
        canvas.height - PADDING_BOTTOM / 2 - TARGET_LOGO_HEIGHT / 2,
        LOGO_WIDTH,
        TARGET_LOGO_HEIGHT
      );
    } else {
      let fallbackHeight = FONT_SIZE * 1.4;
      let LOGO_WIDTH = (logo.width / logo.height) * fallbackHeight;
      const fallbackMaxWidth = Math.min(TARGET_LOGO_WIDTH, Math.max(bottomWidth, FONT_SIZE * 3), canvas.width - FONT_SIZE * 2);
      if (LOGO_WIDTH > fallbackMaxWidth) {
        LOGO_WIDTH = fallbackMaxWidth;
        fallbackHeight = (logo.height / logo.width) * LOGO_WIDTH;
      }
      context.drawImage(
        logo,
        canvas.width - FONT_SIZE - LOGO_WIDTH,
        topLineY - fallbackHeight / 2,
        LOGO_WIDTH,
        fallbackHeight
      );
    }
  }

  return canvas;
};

export { STRAP_FUNC, STRAP_OPTIONS };
