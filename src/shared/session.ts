/** Text handed from background/popup to the standalone converter window. */
const PENDING_KEY = 'pendingText';
const WINDOW_ID_KEY = 'converterWindowId';
const BOUNDS_KEY = 'converterBounds';

export interface WindowBounds {
  width: number;
  height: number;
  left?: number;
  top?: number;
}

export const DEFAULT_BOUNDS: WindowBounds = { width: 560, height: 480 };

export async function setPendingText(text: string): Promise<void> {
  await chrome.storage.session.set({ [PENDING_KEY]: text });
}

export async function takePendingText(): Promise<string | undefined> {
  const stored = await chrome.storage.session.get(PENDING_KEY);
  const text = stored[PENDING_KEY] as string | undefined;
  if (text !== undefined) await chrome.storage.session.remove(PENDING_KEY);
  return text;
}

export async function loadBounds(): Promise<WindowBounds> {
  const stored = await chrome.storage.local.get(BOUNDS_KEY);
  return { ...DEFAULT_BOUNDS, ...(stored[BOUNDS_KEY] as Partial<WindowBounds> | undefined) };
}

export async function saveBounds(bounds: WindowBounds): Promise<void> {
  await chrome.storage.local.set({ [BOUNDS_KEY]: bounds });
}

/** Opens the converter window, or focuses it if it is already open. */
export async function openConverterWindow(text?: string): Promise<void> {
  if (text !== undefined) await setPendingText(text);

  const stored = await chrome.storage.session.get(WINDOW_ID_KEY);
  const existingId = stored[WINDOW_ID_KEY] as number | undefined;
  if (existingId !== undefined) {
    try {
      await chrome.windows.update(existingId, { focused: true });
      // Tell the already-open window to pick up the new text.
      await chrome.runtime.sendMessage({ type: 'pending-text' }).catch(() => undefined);
      return;
    } catch {
      await chrome.storage.session.remove(WINDOW_ID_KEY);
    }
  }

  const bounds = await loadBounds();
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('/window.html'),
    type: 'popup',
    width: bounds.width,
    height: bounds.height,
    left: bounds.left,
    top: bounds.top,
  });
  if (win?.id !== undefined) await chrome.storage.session.set({ [WINDOW_ID_KEY]: win.id });
}

export async function forgetConverterWindow(windowId: number): Promise<void> {
  const stored = await chrome.storage.session.get(WINDOW_ID_KEY);
  if (stored[WINDOW_ID_KEY] === windowId) await chrome.storage.session.remove(WINDOW_ID_KEY);
}
