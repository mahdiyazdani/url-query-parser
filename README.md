# 🔍 URL Query Parser (Chrome Extension)

A lightweight Chrome extension to **parse and inspect URL query parameters**.  
Enter or paste any URL, and the extension extracts query parameters, displays them in a clean table, and remembers the last URL until you clear it.

---

## ✨ Features
- Parse query parameters from any URL.
- Display parameters in a scrollable, styled table.
- Show base URL separately from query string.
- Auto-save last entered/parsed URL (restores when reopening extension).
- Clear button to reset state.
- Works with current tab’s URL if no saved data exists.

---

## 📦 Installation (Development)

1. Clone or download this repository.
2. Open **Google Chrome** and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in top right).
4. Click **Load unpacked** and select this project’s folder.
5. The extension should now appear in your toolbar.

---

## 🛠️ Usage
1. Click the extension icon to open the popup.
2. Paste or type a URL into the textarea.
3. Press **Enter** or click **Parse URL**.
4. Inspect the parsed query parameters in the results table.
5. Use **Clear** to reset input and storage.