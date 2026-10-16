# Translitra

Chrome extension for Cyrillic ⇄ Latin transliteration. Select text on any page and a small tooltip shows the transliteration right away. Direction is detected automatically, four transliteration standards are supported, and everything runs locally in the browser.

## Features

- **Tooltip on selection.** Select text anywhere, get the result with a Copy button. Opt-in: page access is requested only when you turn it on.
- **Auto direction.** Cyrillic → Latin or Latin → Cyrillic, chosen by the dominant script of the selection.
- **Four standards.** Popular (everyday), GOST 7.79-2000 System B, ICAO (Russian passport) and BGN/PCGN.
- **Popup and standalone window.** Click the toolbar icon for a quick converter, or open it in its own window (`Alt+Shift+T`).
- **Context menu.** Right-click a selection → "Transliterate".
- **Settings.** Default standard, tooltip on/off, delay, ignore text fields, light/dark theme.
- **Offline and private.** No network requests, nothing stored except your settings. No host permissions at install; `<all_urls>` is optional and granted only for the tooltip.

Reverse transliteration (Latin → Cyrillic) is inherently ambiguous and marked as approximate in the UI.

## Development

```bash
pnpm install
pnpm dev          # opens Chrome with the extension and hot reload
pnpm test         # vitest, transliteration core
pnpm typecheck    # tsc --noEmit
pnpm build        # .output/chrome-mv3/
pnpm zip          # .output/translitra-<version>-chrome.zip
pnpm smoke        # builds, then drives headless Chrome through the popup, options, window and tooltip
pnpm screenshots  # builds, then renders Chrome Web Store screenshots into store/screenshots/
```

Manual install: `chrome://extensions` → Developer mode → Load unpacked → `.output/chrome-mv3`.

The smoke test loads the extension through the Chrome DevTools Protocol and needs a `google-chrome` binary on `PATH` (override with `CHROME_BIN`). Set `SMOKE_SHOTS=<dir>` to save screenshots of each page.

## Project layout

```
src/
├─ core/             # pure TypeScript transliteration engine, no browser APIs
│  ├─ tables/        # one file per standard
│  ├─ detect.ts      # direction detection
│  ├─ toLatin.ts     # Cyrillic → Latin with context rules and casing
│  └─ toCyrillic.ts  # Latin → Cyrillic, longest-match tokenizer
├─ entrypoints/      # WXT entrypoints: background, content, popup, window, options
├─ shared/           # settings, session state, i18n helpers, shared converter UI
└─ public/           # icons and _locales (en, ru)
tests/core/          # vitest
scripts/smoke.mjs    # headless Chrome smoke test
store/               # Chrome Web Store texts and generated screenshots
docs/                # GitHub Pages: landing and privacy policy
```

Built with [WXT](https://wxt.dev) (Manifest V3), vanilla TypeScript and Vitest.

## Publishing

Store listing texts, permission justifications and the privacy policy URL are in [store/description.md](store/description.md). The privacy policy is served from GitHub Pages at https://vadimvalid.github.io/translitra/privacy.html (deployed automatically from `docs/` by the Pages workflow).

## License

[MIT](LICENSE)
