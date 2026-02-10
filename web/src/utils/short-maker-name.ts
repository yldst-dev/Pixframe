/**
 * Short maker name mapping for portrait images
 * Converts long manufacturer names to short versions to save space
 */

const MAKER_SHORT_NAMES: Record<string, string> = {
  // RICOH
  'RICOH IMAGING COMPANY, LTD.': 'RICOH',
  'RICOH IMAGING COMPANY': 'RICOH',
  'RICOH': 'RICOH',
  
  // SONY
  'SONY CORPORATION': 'SONY',
  'SONY': 'SONY',
  
  // CANON
  'CANON INC.': 'CANON',
  'CANON': 'CANON',
  
  // NIKON
  'NIKON CORPORATION': 'NIKON',
  'NIKON': 'NIKON',
  
  // FUJIFILM
  'FUJIFILM CORPORATION': 'FUJIFILM',
  'FUJIFILM': 'FUJIFILM',
  'FUJI': 'FUJIFILM',
  
  // OLYMPUS
  'OLYMPUS CORPORATION': 'OLYMPUS',
  'OLYMPUS IMAGING CORP.': 'OLYMPUS',
  'OLYMPUS': 'OLYMPUS',
  
  // OM SYSTEM (new Olympus brand)
  'OM DIGITAL SOLUTIONS': 'OM SYSTEM',
  'OM SYSTEM': 'OM SYSTEM',
  
  // PANASONIC
  'PANASONIC CORPORATION': 'PANASONIC',
  'PANASONIC': 'PANASONIC',
  'LUMIX': 'LUMIX',
  
  // SAMSUNG
  'SAMSUNG ELECTRONICS': 'SAMSUNG',
  'SAMSUNG TECHWIN': 'SAMSUNG',
  'SAMSUNG': 'SAMSUNG',
  
  // PENTAX
  'PENTAX CORPORATION': 'PENTAX',
  'PENTAX': 'PENTAX',
  
  // SIGMA
  'SIGMA CORPORATION': 'SIGMA',
  'SIGMA': 'SIGMA',
  
  // LEICA
  'LEICA CAMERA AG': 'LEICA',
  'LEICA': 'LEICA',
  
  // HASSELBLAD
  'HASSELBLAD': 'HASSELBLAD',
  
  // PHASE ONE
  'PHASE ONE A/S': 'PHASE ONE',
  'PHASE ONE': 'PHASE ONE',
  
  // DJI
  'DJI': 'DJI',
  
  // APPLE
  'APPLE': 'APPLE',
  
  // LG
  'LG ELECTRONICS': 'LG',
  'LG': 'LG',
  
  // EPSON
  'SEIKO EPSON CORP.': 'EPSON',
  'EPSON': 'EPSON',
  
  // MAMIYA
  'MAMIYA-OP CO.,LTD.': 'MAMIYA',
  'MAMIYA': 'MAMIYA',
  
  // CONTAX
  'CONTAX': 'CONTAX',
  
  // GOLDSTAR
  'GOLDSTAR': 'GOLDSTAR',
};

/**
 * Get shortened maker name for portrait images
 * @param make Original maker name from EXIF
 * @returns Shortened maker name
 */
export function getShortMakerName(make: string): string {
  if (!make) return '';
  
  const upperMake = make.toUpperCase().trim();
  
  // Direct match
  if (MAKER_SHORT_NAMES[upperMake]) {
    return MAKER_SHORT_NAMES[upperMake];
  }
  
  // Partial match - check if any key is contained in the make
  for (const [key, shortName] of Object.entries(MAKER_SHORT_NAMES)) {
    if (upperMake.includes(key) || key.includes(upperMake)) {
      return shortName;
    }
  }
  
  // Fallback: return first word (usually the brand name)
  const firstWord = make.trim().split(/[\s,]+/)[0];
  return firstWord.toUpperCase();
}
