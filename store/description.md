# Chrome Web Store listing

## Short description (≤ 132 chars)

EN: Instant Cyrillic ⇄ Latin transliteration: select text and see the result. GOST, passport, BGN/PCGN. Offline.

RU: Мгновенная транслитерация кириллица ⇄ латиница: выделите текст и увидьте результат. ГОСТ, загранпаспорт, BGN/PCGN. Офлайн.

## Full description

### EN

Translitra transliterates text between Cyrillic and Latin alphabets right where you read it.

• Select text on any page and a small tooltip shows the transliteration with a Copy button.
• Direction is detected automatically: Cyrillic → Latin or Latin → Cyrillic.
• Four standards: Popular (everyday chat/URL style), GOST 7.79-2000 System B, ICAO (Russian international passport) and BGN/PCGN.
• Click the toolbar icon for a quick converter, or open it in a separate window with Alt+Shift+T.
• Right-click a selection → "Transliterate".
• Settings: default standard, tooltip on/off and delay, ignore text fields, light/dark theme.
• Works fully offline. Nothing is sent anywhere.

Latin → Cyrillic is approximate by nature (for example "e" can mean е or э), and the extension says so in the interface.

### RU

Translitra транслитерирует текст между кириллицей и латиницей прямо там, где вы его читаете.

• Выделите текст на любой странице — рядом появится подсказка с результатом и кнопкой «Копировать».
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
- **activeTab** + **scripting** — reads the current text selection of the active tab when the user clicks the toolbar icon or presses the shortcut.
- **Host permissions `<all_urls>`** — the content script shows the tooltip next to selected text on any page. It only reads the text the user selected, processes it locally and never sends it anywhere.

## Data usage

The extension does not collect, transmit or store any user data. Settings are kept in Chrome's sync storage.
