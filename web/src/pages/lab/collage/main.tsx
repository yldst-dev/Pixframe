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

type NumericListInputProps = {
  title: string;
  info: string;
  value: number;
  min?: number;
  onCommit: (value: number) => void;
};

const NumericListInput = ({ title, info, value, min, onCommit }: NumericListInputProps) => {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const commitValue = () => {
    const nextValue = parseIntegerInput(inputValue, value, min);
    setInputValue(String(nextValue));
    onCommit(nextValue);
  };

  return (
    <ListInput
      title={title}
      info={info}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={inputValue}
      onChange={(e) => setInputValue(normalizeIntegerInput(e.target.value))}
      onBlur={commitValue}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
};

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
        <NumericListInput title="NUMBER_OF_ROW" info="count" value={numberOfRow} min={1} onCommit={setNumberOfRow} />
        <NumericListInput title="NUMBER_OF_COLUMN" info="count" value={numberOfColumn} min={1} onCommit={setNumberOfColumn} />
        <NumericListInput title="PADDING_TOP" info="px" value={paddingTop} min={0} onCommit={setPaddingTop} />
        <NumericListInput title="PADDING_BOTTOM" info="px" value={paddingBottom} min={0} onCommit={setPaddingBottom} />
        <NumericListInput title="PADDING_LEFT" info="px" value={paddingLeft} min={0} onCommit={setPaddingLeft} />
        <NumericListInput title="PADDING_RIGHT" info="px" value={paddingRight} min={0} onCommit={setPaddingRight} />
        <NumericListInput title="MARGIN_EACH" info="px" value={marginEach} min={0} onCommit={setMarginEach} />
      </List>

      <Loading />
    </>
  );
};

export default Collage;
