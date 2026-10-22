import { ImageRecord, StorageDuration } from '../types';

export type ThemeMode = 'dark' | 'midnight' | 'deep';

export interface CompressionSettings {
  level: 'original' | 'low' | 'medium' | 'high';
  format: 'original' | 'webp' | 'jpeg' | 'png';
  resize: 'original' | 1920 | 1280 | 1024 | 'custom';
  customWidth?: number;
  customHeight?: number;
}

export interface UserPreferences {
  defaultExpiration: StorageDuration;
  autoCopyUrl: boolean;
}

const HISTORY_KEY = 'imageHistory';
const THEME_KEY = 'theme';
const COMPRESSION_KEY = 'compressionSettings';
const PREFERENCES_KEY = 'preferences';

// --- Short-lived Runtime Memory for Active Session Deletion ---
// The delete token is NEVER saved to persistent localStorage.
const sessionDeleteTokens: Map<string, string> = new Map();

export function setSessionDeleteToken(id: string, token: string): void {
  if (id && token) {
    sessionDeleteTokens.set(id, token);
  }
}

export function getSessionDeleteToken(id: string): string | undefined {
  return sessionDeleteTokens.get(id);
}

export function removeSessionDeleteToken(id: string): void {
  sessionDeleteTokens.delete(id);
}

// --- Image History (Metadata Only - Never Base64, Binary, or Delete Secrets) ---
export function getImageHistory(): ImageRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: ImageRecord[] = JSON.parse(raw);
    const now = Date.now();
    return list
      .filter((item) => !item.expiresAt || item.expiresAt > now)
      .map((item) => {
        // Guarantee deleteToken is stripped from history objects
        const clean = { ...item };
        delete clean.deleteToken;
        return clean;
      });
  } catch (err) {
    console.error('Failed to read image history from localStorage:', err);
    return [];
  }
}

export function saveImageToHistory(record: ImageRecord): void {
  try {
    // 1. Store deleteToken strictly in short-lived runtime memory for the active session
    if (record.deleteToken) {
      setSessionDeleteToken(record.id, record.deleteToken);
    }

    // 2. Persist ONLY safe metadata to localStorage (NO deleteToken, NO Base64, NO binary)
    const existing = getImageHistory();
    const cleanRecord: ImageRecord = {
      id: record.id,
      originalFilename: record.originalFilename,
      sanitizedFilename: record.sanitizedFilename,
      mimeType: record.mimeType,
      size: record.size,
      width: record.width,
      height: record.height,
      publicUrl: record.publicUrl,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      storageProvider: record.storageProvider,
      objectKey: record.objectKey,
    };

    const filtered = existing.filter((item) => item.id !== cleanRecord.id);
    filtered.unshift(cleanRecord);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save image history to localStorage:', err);
  }
}

export function removeImageFromHistory(id: string): void {
  try {
    removeSessionDeleteToken(id);
    const existing = getImageHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove image from history:', err);
  }
}

export function clearImageHistory(): void {
  try {
    sessionDeleteTokens.clear();
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear image history:', err);
  }
}

// --- Theme Preference ---
export function getThemePreference(): ThemeMode {
  try {
    const theme = localStorage.getItem(THEME_KEY) as ThemeMode;
    if (theme === 'midnight' || theme === 'deep' || theme === 'dark') {
      return theme;
    }
  } catch {}
  return 'dark';
}

export function setThemePreference(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyThemeClass(theme);
  } catch (err) {
    console.error('Failed to save theme preference:', err);
  }
}

export function applyThemeClass(theme: ThemeMode): void {
  document.documentElement.classList.remove('theme-dark', 'theme-midnight', 'theme-deep');
  document.documentElement.classList.add(`theme-${theme}`);
}

// --- Compression Settings ---
const defaultCompression: CompressionSettings = {
  level: 'original',
  format: 'original',
  resize: 'original',
};

export function getCompressionSettings(): CompressionSettings {
  try {
    const raw = localStorage.getItem(COMPRESSION_KEY);
    if (raw) {
      return { ...defaultCompression, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultCompression;
}

export function saveCompressionSettings(settings: CompressionSettings): void {
  try {
    localStorage.setItem(COMPRESSION_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save compression settings:', err);
  }
}

// --- User Preferences ---
const defaultPreferences: UserPreferences = {
  defaultExpiration: 'never',
  autoCopyUrl: false,
};

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      return { ...defaultPreferences, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultPreferences;
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save user preferences:', err);
  }
}
