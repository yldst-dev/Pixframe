export const normalizeIntegerInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/^0+(?=\d)/, '');
};

export const parseIntegerInput = (value: string, fallback: number, min?: number, max?: number): number => {
  const parsed = Number.parseInt(normalizeIntegerInput(value), 10);
  let nextValue = Number.isFinite(parsed) ? parsed : fallback;

  if (min !== undefined) {
    nextValue = Math.max(nextValue, min);
  }

  if (max !== undefined) {
    nextValue = Math.min(nextValue, max);
  }

  return nextValue;
};

export const normalizeDecimalInput = (value: string): string => {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integer = '', ...fractionParts] = normalized.split('.');
  const integerPart = integer.replace(/^0+(?=\d)/, '');
  const fractionPart = fractionParts.join('');

  if (normalized.startsWith('.')) return `.${fractionPart}`;
  if (normalized.includes('.')) return `${integerPart}.${fractionPart}`;
  return integerPart;
};

export const parseDecimalInput = (value: string, fallback: number, min?: number, max?: number): number => {
  const parsed = Number.parseFloat(normalizeDecimalInput(value));
  let nextValue = Number.isFinite(parsed) ? parsed : fallback;

  if (min !== undefined) {
    nextValue = Math.max(nextValue, min);
  }

  if (max !== undefined) {
    nextValue = Math.min(nextValue, max);
  }

  return nextValue;
};
