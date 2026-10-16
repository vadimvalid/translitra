# Chrome Web Store listing

## Short description (≤ 132 chars)

EN: Instant Cyrillic ⇄ Latin transliteration: select text and see the result. GOST, passport, BGN/PCGN. Offline.

RU: Мгновенная транслитерация кириллица ⇄ латиница: выделите текст и увидьте результат. ГОСТ, загранпаспорт, BGN/PCGN. Офлайн.

## Full description

### EN

Translitra transliterates text between Cyrillic and Latin alphabets right where you read it.

• Turn on the selection tooltip and a small bubble with the transliteration appears whenever you select text on a page, with a Copy button.
• Direction is detected automatically: Cyrillic → Latin or Latin → Cyrillic.
• Four standards: Popular (everyday chat/URL style), GOST 7.79-2000 System B, ICAO (Russian international passport) and BGN/PCGN.
• Click the toolbar icon for a quick converter, or open it in a separate window with Alt+Shift+T.
• Right-click a selection → "Transliterate".
• Settings: default standard, tooltip on/off and delay, ignore text fields, light/dark theme.
• Works fully offline. Nothing is sent anywhere.

Latin → Cyrillic is approximate by nature (for example "e" can mean е or э), and the extension says so in the interface.

### RU

Translitra транслитерирует текст между кириллицей и латиницей прямо там, где вы его читаете.

• Включите подсказку при выделении — и рядом с выделенным текстом на любой странице будет появляться пузырёк с результатом и кнопкой «Копировать».
• Направление определяется автоматически: кириллица → латиница или латиница → кириллица.
• Четыре стандарта: «народный» (как пишут в чатах и адресах), ГОСТ 7.79-2000 (система Б), ICAO (загранпаспорт РФ) и BGN/PCGN.
• Кнопка на панели открывает быстрый конвертер, Alt+Shift+T — отдельное окно.
• Правый клик по выделению → «Транслитерировать».
• Настройки: стандарт по умолчанию, вкл/выкл подсказки и её задержка, игнорирование полей ввода, светлая/тёмная тема.
• Полностью офлайн. Ничего никуда не отправляется.

Обратный транслит (латиница → кириллица) по своей природе неточен (например, «e» может означать е или э), интерфейс об этом предупреждает.

## Single purpose

Transliteration of text between Cyrillic and Latin alphabets.

## Permission justifications

- **contextMenus** — adds the "Transliterate" item to the right-click menu for selected text.
- **storage** — saves user settings (standard, tooltip options, theme) and the converter window position.
- **activeTab** — reads the current text selection of the active tab when the user clicks the toolbar icon or presses the shortcut, so the popup opens with that text already filled in.
- **scripting** — runs a one-line script (with activeTab) that returns the user's current selection, and registers the optional tooltip content script once the user has granted page access.
- **Optional host permissions `<all_urls>`** — not requested at install. The selection tooltip is off by default; when the user turns it on in settings or in the popup, Chrome shows its permission prompt. Only then is the tooltip script registered. It reads only the text the user explicitly selected, processes it locally and never sends it anywhere. Turning the tooltip off removes the permission again.

## Privacy policy URL

https://vadimvalid.github.io/translitra/privacy.html

## Data usage

The extension does not collect, transmit or store any user data. Settings are kept in Chrome's sync storage.

## Assets

- Screenshots 1280×800: `store/screenshots/1-tooltip.png` … `4-options.png`
- Small promo tile 440×280: `store/screenshots/promo-small-440x280.png`
- Icon 128×128: `src/public/icon/128.png`

Regenerate with `pnpm screenshots`.
