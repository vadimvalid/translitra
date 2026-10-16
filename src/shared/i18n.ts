export function t(key: string, substitutions?: string | string[]): string {
  const msg = chrome.i18n.getMessage(key, substitutions);
  return msg || key;
}

/** Replaces text of every element with a data-i18n attribute. */
export function localizeDom(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.setAttribute('placeholder', t(key));
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (key) el.setAttribute('title', t(key));
  });
}
