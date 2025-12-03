import { LocalStorageError } from '../types';

/**
 * Safe localStorage utility class with error handling
 */
export class SafeStorage {
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

  /**
   * Safely gets an item from localStorage
   * @param key - The key to retrieve
   * @param fallback - Fallback value if key doesn't exist or storage is unavailable
   * @returns The stored value or fallback
   */
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

  /**
   * Safely gets and parses a JSON item from localStorage
   * @param key - The key to retrieve
   * @param fallback - Fallback value if key doesn't exist, is invalid JSON, or storage is unavailable
   * @returns The parsed value or fallback
   */
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

  /**
   * Safely gets a boolean item from localStorage
   * @param key - The key to retrieve
   * @param fallback - Fallback value
   * @returns Boolean value or fallback
   */
  static getBooleanItem(key: string, fallback: boolean = false): boolean {
    const value = this.getItem(key, fallback.toString());
    return value === 'true';
  }

  /**
   * Safely gets a number item from localStorage
   * @param key - The key to retrieve
   * @param fallback - Fallback value
   * @returns Number value or fallback
   */
  static getNumberItem(key: string, fallback: number = 0): number {
    const value = this.getItem(key, fallback.toString());
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Safely gets an integer item from localStorage
   * @param key - The key to retrieve
   * @param fallback - Fallback value
   * @returns Integer value or fallback
   */
  static getIntItem(key: string, fallback: number = 0): number {
    const value = this.getItem(key, fallback.toString());
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Safely sets an item in localStorage
   * @param key - The key to set
   * @param value - The value to store
   * @throws LocalStorageError if unable to store
   */
  static setItem(key: string, value: string): void {
    if (!this.isAvailable()) {
      throw new LocalStorageError('localStorage is not available', key);
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      throw new LocalStorageError(`Failed to set localStorage item for key: ${key}`, key);
    }
  }

  /**
   * Safely sets a JSON item in localStorage
   * @param key - The key to set
   * @param value - The value to serialize and store
   * @throws LocalStorageError if unable to store or serialize
   */
  static setJSONItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.setItem(key, serialized);
    } catch (error) {
      throw new LocalStorageError(`Failed to serialize value for localStorage key: ${key}`, key);
    }
  }

  /**
   * Safely sets a boolean item in localStorage
   * @param key - The key to set
   * @param value - The boolean value to store
   */
  static setBooleanItem(key: string, value: boolean): void {
    this.setItem(key, value.toString());
  }

  /**
   * Safely sets a number item in localStorage
   * @param key - The key to set
   * @param value - The number value to store
   */
  static setNumberItem(key: string, value: number): void {
    this.setItem(key, value.toString());
  }

  /**
   * Safely removes an item from localStorage
   * @param key - The key to remove
   */
  static removeItem(key: string): void {
    if (!this.isAvailable()) {
      console.warn(`localStorage is not available, cannot remove key: ${key}`);
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item for key: ${key}`, error);
    }
  }

  /**
   * Safely clears all localStorage items
   */
  static clear(): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available, cannot clear');
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage', error);
    }
  }

  /**
   * Gets all localStorage keys safely
   * @returns Array of keys or empty array if unavailable
   */
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

// Convenience exports
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