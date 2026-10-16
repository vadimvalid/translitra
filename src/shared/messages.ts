export type Message = { type: 'pending-text' } | { type: 'get-selection' };

export function sendMessage(message: Message): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

/** Reads the current text selection of the active tab (requires activeTab). */
export async function readActiveTabSelection(): Promise<string> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return '';
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? '',
    });
    return typeof results[0]?.result === 'string' ? results[0].result : '';
  } catch {
    // chrome:// pages, the Web Store and PDF viewer refuse script injection.
    return '';
  }
}
