import { create } from 'zustand';
import { SafeStorage } from '../utils/safe-storage';
import { NO_FRAME_THEME_FUNC, NO_FRAME_OPTIONS } from './01_NO_FRAME';
import { ONE_LINE_FUNC, ONE_LINE_OPTIONS } from './03_ONE_LINE';
import { TWO_LINE_FUNC, TWO_LINE_OPTIONS } from './04_TWO_LINE';
import { JUST_FRAME_FUNC, JUST_FRAME_OPTIONS } from './02_JUST_FRAME';
import { STRAP_FUNC, STRAP_OPTIONS } from './07_STRAP';
import { SHOT_ON_ONE_LINE_FUNC, SHOT_ON_ONE_LINE_OPTIONS } from './05_SHOT_ON_ONE_LINE';
import { SHOT_ON_TWO_LINE_FUNC, SHOT_ON_TWO_LINE_OPTIONS } from './06_SHOT_ON_TWO_LINE';
import { FILM_FUNC, FILM_OPTIONS } from './08_FILM';
import { MONITOR_FUNC, MONITOR_OPTIONS } from './09_MONITOR';
import { LIGHTROOM_FUNC, LIGHTROOM_OPTIONS } from './10_LIGHTROOM';
import { CUSTOM_ONE_LINE_FUNC, CUSTOM_ONE_LINE_OPTIONS } from './11_CUSTOM_ONE_LINE';
import { CUSTOM_TWO_LINE_FUNC, CUSTOM_TWO_LINE_OPTIONS } from './12_CUSTOM_TWO_LINE';
import { TIP_FUNC, TIP_OPTIONS } from './13_TIP';
import { POSTER_FUNC, POSTER_OPTIONS } from './14_POSTER';
import { CINEMASCOPE_FUNC, CINEMASCOPE_OPTIONS } from './15_CINEMASCOPE';
import { SIMPLE_FUNC, SIMPLE_OPTIONS } from './16_SIMPLE';

type AcceptInputType = string | number | boolean;

type ThemeStore = {
  option: Map<string, AcceptInputType>;
  setOption: (key: string, value: AcceptInputType) => void;
  clearOption: () => void;
  removeOptions: (keys: string[]) => void;
  replaceOptions: (removeKeys: string[], newOptions: Map<string, AcceptInputType>) => void;
};

const useThemeStore = create<ThemeStore>((set) => ({
  option: (() => {
    try {
      const saved = SafeStorage.getItem('option', '');
      return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch {
      return new Map();
    }
  })(),
  setOption: (key, value) => {
    set((state) => {
      const newOption = new Map(state.option);
      newOption.set(key, value);
      try {
        SafeStorage.setItem('option', JSON.stringify(Array.from(newOption.entries())));
      } catch (error) {
        console.error('Failed to save theme option:', error);
      }
      return { ...state, option: newOption };
    });
  },
  clearOption: () => {
    set((state) => {
      const newOption = new Map();
      try {
        SafeStorage.removeItem('option');
      } catch (error) {
        console.error('Failed to clear theme options:', error);
      }
      return { ...state, option: newOption };
    });
  },
  removeOptions: (keys) => {
    set((state) => {
      const newOption = new Map(state.option);
      keys.forEach(key => newOption.delete(key));
      try {
        SafeStorage.setItem('option', JSON.stringify(Array.from(newOption.entries())));
      } catch (error) {
        console.error('Failed to remove theme options:', error);
      }
      return { ...state, option: newOption };
    });
  },
  replaceOptions: (removeKeys, newOptions) => {
    set((state) => {
      // 원자적 업데이트로 깜빡임 최소화
      const newOption = new Map();
      
      // 기존 옵션 중 제거하지 않을 것들 유지
      state.option.forEach((value, key) => {
        if (!removeKeys.includes(key)) {
          newOption.set(key, value);
        }
      });
      
      // 새 옵션들 추가
      newOptions.forEach((value, key) => {
        newOption.set(key, value);
      });
      
      try {
        SafeStorage.setItem('option', JSON.stringify(Array.from(newOption.entries())));
      } catch (error) {
        console.error('Failed to replace theme options:', error);
      }
      return { ...state, option: newOption };
    });
  },
}));

const themes = [
  { name: 'No frame', func: NO_FRAME_THEME_FUNC, options: NO_FRAME_OPTIONS },
  { name: 'Just frame', func: JUST_FRAME_FUNC, options: JUST_FRAME_OPTIONS },
  { name: 'Simple', func: SIMPLE_FUNC, options: SIMPLE_OPTIONS },
  { name: 'Strap', func: STRAP_FUNC, options: STRAP_OPTIONS },
  { name: 'One line', func: ONE_LINE_FUNC, options: ONE_LINE_OPTIONS },
  { name: 'Two line', func: TWO_LINE_FUNC, options: TWO_LINE_OPTIONS },
  { name: 'Shot on one line', func: SHOT_ON_ONE_LINE_FUNC, options: SHOT_ON_ONE_LINE_OPTIONS },
  { name: 'Shot on two line', func: SHOT_ON_TWO_LINE_FUNC, options: SHOT_ON_TWO_LINE_OPTIONS },
  { name: 'Film', func: FILM_FUNC, options: FILM_OPTIONS },
  { name: 'Monitor', func: MONITOR_FUNC, options: MONITOR_OPTIONS },
  { name: 'Lightroom', func: LIGHTROOM_FUNC, options: LIGHTROOM_OPTIONS },
  { name: 'Custom One Line', func: CUSTOM_ONE_LINE_FUNC, options: CUSTOM_ONE_LINE_OPTIONS },
  { name: 'Custom Two Line', func: CUSTOM_TWO_LINE_FUNC, options: CUSTOM_TWO_LINE_OPTIONS },
  { name: 'Poster', func: POSTER_FUNC, options: POSTER_OPTIONS },
  { name: 'Tip', func: TIP_FUNC, options: TIP_OPTIONS },
  { name: 'Cinema Scope', func: CINEMASCOPE_FUNC, options: CINEMASCOPE_OPTIONS },
];

export default themes;
export { useThemeStore };
