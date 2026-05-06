import { BlockTitle, BlockHeader, List, ListInput, Block } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddPhotoButton from './components/add-photo.button';
import AddedPhotoListItem from './components/added-photo.list-item';
import DownloadPhotoButton from './components/download-photo.button';
import Loading from './components/loading';
import { useStore } from './store';
import * as Root from '../../../store';
import { normalizeIntegerInput, parseIntegerInput } from '../../../utils/numeric-input';

type NumericInputKey = 'numberOfRow' | 'numberOfColumn' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'marginEach';

type NumericInputValues = Record<NumericInputKey, string>;

const createNumericInputValues = (values: Record<NumericInputKey, number>): NumericInputValues => ({
  numberOfRow: String(values.numberOfRow),
  numberOfColumn: String(values.numberOfColumn),
  paddingTop: String(values.paddingTop),
  paddingBottom: String(values.paddingBottom),
  paddingLeft: String(values.paddingLeft),
  paddingRight: String(values.paddingRight),
  marginEach: String(values.marginEach),
});

const Collage = () => {
  const { t } = useTranslation();
  const { darkMode } = Root.useStore();
  const {
    backgroundColor,
    ratio,
    numberOfRow,
    numberOfColumn,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    marginEach,
    setBackgroundColor,
    setRatio,
    setNumberOfRow,
    setNumberOfColumn,
    setPaddingTop,
    setPaddingBottom,
    setPaddingLeft,
    setPaddingRight,
    setMarginEach,
  } = useStore();
  const [numericInputs, setNumericInputs] = useState<NumericInputValues>(() =>
    createNumericInputValues({ numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach }),
  );

  useEffect(() => {
    setNumericInputs(createNumericInputValues({ numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach }));
  }, [numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach]);

  const handleNumericInputChange = (key: NumericInputKey, value: string) => {
    setNumericInputs((prev) => ({
      ...prev,
      [key]: normalizeIntegerInput(value),
    }));
  };

  const commitNumericInput = (key: NumericInputKey, currentValue: number, setter: (value: number) => void, min?: number) => {
    const nextValue = parseIntegerInput(numericInputs[key], currentValue, min);
    setNumericInputs((prev) => ({
      ...prev,
      [key]: String(nextValue),
    }));
    setter(nextValue);
  };

  return (
    <>
      <BlockTitle>{t('lab.collage')}</BlockTitle>

      <BlockHeader>{t('lab.collage-description')}</BlockHeader>
      <List strong inset>
        <AddedPhotoListItem />
        <AddPhotoButton />
        <DownloadPhotoButton />
      </List>

      <Block>
        <p>{t('lab.collage-options')}</p>
      </Block>

      <List strong inset>
        <ListInput
          title="BACKGROUND_COLOR"
          media={<div className="w-5 h-5" style={{ backgroundColor: backgroundColor as string, outline: `1px solid ${darkMode ? '#fff' : '#000'}` }} />}
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
        <ListInput title="RATIO" info="width:height" value={ratio} onChange={(e) => setRatio(e.target.value)} />
        <ListInput
          title="NUMBER_OF_ROW"
          info="count"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.numberOfRow}
          onChange={(e) => handleNumericInputChange('numberOfRow', e.target.value)}
          onBlur={() => commitNumericInput('numberOfRow', numberOfRow, setNumberOfRow, 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="NUMBER_OF_COLUMN"
          info="count"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.numberOfColumn}
          onChange={(e) => handleNumericInputChange('numberOfColumn', e.target.value)}
          onBlur={() => commitNumericInput('numberOfColumn', numberOfColumn, setNumberOfColumn, 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="PADDING_TOP"
          info="px"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.paddingTop}
          onChange={(e) => handleNumericInputChange('paddingTop', e.target.value)}
          onBlur={() => commitNumericInput('paddingTop', paddingTop, setPaddingTop, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="PADDING_BOTTOM"
          info="px"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.paddingBottom}
          onChange={(e) => handleNumericInputChange('paddingBottom', e.target.value)}
          onBlur={() => commitNumericInput('paddingBottom', paddingBottom, setPaddingBottom, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="PADDING_LEFT"
          info="px"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.paddingLeft}
          onChange={(e) => handleNumericInputChange('paddingLeft', e.target.value)}
          onBlur={() => commitNumericInput('paddingLeft', paddingLeft, setPaddingLeft, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="PADDING_RIGHT"
          info="px"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.paddingRight}
          onChange={(e) => handleNumericInputChange('paddingRight', e.target.value)}
          onBlur={() => commitNumericInput('paddingRight', paddingRight, setPaddingRight, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
        <ListInput
          title="MARGIN_EACH"
          info="px"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={numericInputs.marginEach}
          onChange={(e) => handleNumericInputChange('marginEach', e.target.value)}
          onBlur={() => commitNumericInput('marginEach', marginEach, setMarginEach, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </List>

      <Loading />
    </>
  );
};

export default Collage;
