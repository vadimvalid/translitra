import type { DirectionOption, Standard } from '../core';

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  standard: Standard;
  direction: DirectionOption;
  tooltipEnabled: boolean;
  /** Delay before the tooltip appears, in milliseconds. */
  tooltipDelay: number;
  /** Do not show the tooltip for selections inside inputs, textareas and contenteditable. */
  ignoreInputs: boolean;
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  standard: 'popular',
  direction: 'auto',
  // Off until the user grants page access (see shared/permissions.ts).
  tooltipEnabled: false,
  tooltipDelay: 150,
  ignoreInputs: true,
  theme: 'system',
};

const KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await chrome.storage.sync.set({ [KEY]: next });
  return next;
}

export function onSettingsChange(listener: (settings: Settings) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'sync' || !(KEY in changes)) return;
    const value = changes[KEY]?.newValue as Partial<Settings> | undefined;
    listener({ ...DEFAULT_SETTINGS, ...value });
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
