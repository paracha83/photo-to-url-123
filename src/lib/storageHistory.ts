import { ImageRecord } from '../types';
import {
  getImageHistory,
  saveImageToHistory,
  removeImageFromHistory,
  clearImageHistory,
} from './userPreferences';

export function getLocalHistory(): ImageRecord[] {
  return getImageHistory();
}

export function saveToHistory(record: ImageRecord): void {
  saveImageToHistory(record);
}

export function removeFromHistory(id: string): void {
  removeImageFromHistory(id);
}

export function clearHistory(): void {
  clearImageHistory();
}

export * from './userPreferences';
