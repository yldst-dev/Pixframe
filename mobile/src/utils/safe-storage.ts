import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { LocalStorageError } from '../types';

const NATIVE_KEY_PREFIX = 'ls:';

export class SafeStorage {
  private static hydrated = false;
  private static lifecycleReady = false;

  private static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  private static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static toNativeKey(key: string): string {
    return `${NATIVE_KEY_PREFIX}${key}`;
  }

  private static fromNativeKey(key: string): string {
    return key.startsWith(NATIVE_KEY_PREFIX) ? key.slice(NATIVE_KEY_PREFIX.length) : key;
  }

  private static async setNativeItem(key: string, value: string): Promise<void> {
    if (!this.isNativePlatform()) return;
    await Preferences.set({ key: this.toNativeKey(key), value });
  }

  private static async removeNativeItem(key: string): Promise<void> {
    if (!this.isNativePlatform()) return;
    await Preferences.remove({ key: this.toNativeKey(key) });
  }

  static async hydrateFromNative(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;

    if (!this.isNativePlatform() || !this.isAvailable()) return;

    try {
      const { keys } = await Preferences.keys();
      const nativeKeys = keys.filter((key) => key.startsWith(NATIVE_KEY_PREFIX));
      await Promise.all(
        nativeKeys.map(async (nativeKey) => {
          const { value } = await Preferences.get({ key: nativeKey });
          if (value === null) return;
          localStorage.setItem(this.fromNativeKey(nativeKey), value);
        })
      );
    } catch (error) {
      console.error('Failed to hydrate storage from native preferences', error);
    }
  }

  static async flushToNative(): Promise<void> {
    if (!this.isNativePlatform() || !this.isAvailable()) return;

    try {
      const keys = Object.keys(localStorage);
      await Promise.all(
        keys.map(async (key) => {
          const value = localStorage.getItem(key);
          if (value === null) return;
          await this.setNativeItem(key, value);
        })
      );
    } catch (error) {
      console.error('Failed to flush local storage into native preferences', error);
    }
  }

  static async setupLifecycleSync(): Promise<void> {
    if (this.lifecycleReady || !this.isNativePlatform()) return;
    this.lifecycleReady = true;

    await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        void this.flushToNative();
      }
    });
  }

  static getItem<T = string>(key: string, fallback: T): T {
    if (!this.isAvailable()) {
      console.warn(`localStorage is not available, using fallback for key: ${key}`);
      return fallback;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return fallback;
      }
      return item as T;
    } catch (error) {
      console.error(`Failed to get localStorage item for key: ${key}`, error);
      return fallback;
    }
  }

  static getJSONItem<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) {
      console.warn(`localStorage is not available, using fallback for key: ${key}`);
      return fallback;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return fallback;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for localStorage key: ${key}`, error);
      return fallback;
    }
  }

  static getBooleanItem(key: string, fallback = false): boolean {
    const value = this.getItem(key, fallback.toString());
    return value === 'true';
  }

  static getNumberItem(key: string, fallback = 0): number {
    const value = this.getItem(key, fallback.toString());
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static getIntItem(key: string, fallback = 0): number {
    const value = this.getItem(key, fallback.toString());
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static setItem(key: string, value: string): void {
    if (!this.isAvailable()) {
      throw new LocalStorageError('localStorage is not available', key);
    }

    try {
      localStorage.setItem(key, value);
      void this.setNativeItem(key, value);
    } catch {
      throw new LocalStorageError(`Failed to set localStorage item for key: ${key}`, key);
    }
  }

  static setJSONItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.setItem(key, serialized);
    } catch {
      throw new LocalStorageError(`Failed to serialize value for localStorage key: ${key}`, key);
    }
  }

  static setBooleanItem(key: string, value: boolean): void {
    this.setItem(key, value.toString());
  }

  static setNumberItem(key: string, value: number): void {
    this.setItem(key, value.toString());
  }

  static removeItem(key: string): void {
    if (!this.isAvailable()) {
      console.warn(`localStorage is not available, cannot remove key: ${key}`);
      return;
    }

    try {
      localStorage.removeItem(key);
      void this.removeNativeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item for key: ${key}`, error);
    }
  }

  static clear(): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available, cannot clear');
      return;
    }

    try {
      const keys = this.keys();
      localStorage.clear();
      keys.forEach((key) => {
        void this.removeNativeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  }

  static keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Failed to get localStorage keys', error);
      return [];
    }
  }
}

export async function initializeSafeStorage(): Promise<void> {
  await SafeStorage.hydrateFromNative();
  await SafeStorage.setupLifecycleSync();
}

export const getStorageItem = SafeStorage.getItem.bind(SafeStorage);
export const getStorageJSONItem = SafeStorage.getJSONItem.bind(SafeStorage);
export const getStorageBooleanItem = SafeStorage.getBooleanItem.bind(SafeStorage);
export const getStorageNumberItem = SafeStorage.getNumberItem.bind(SafeStorage);
export const getStorageIntItem = SafeStorage.getIntItem.bind(SafeStorage);
export const setStorageItem = SafeStorage.setItem.bind(SafeStorage);
export const setStorageJSONItem = SafeStorage.setJSONItem.bind(SafeStorage);
export const setStorageBooleanItem = SafeStorage.setBooleanItem.bind(SafeStorage);
export const setStorageNumberItem = SafeStorage.setNumberItem.bind(SafeStorage);
export const removeStorageItem = SafeStorage.removeItem.bind(SafeStorage);
