# Glimpse 👁️

> **Instantly look up any word or concept while watching YouTube — without leaving the video.**  
> Select a word, get a dictionary definition and Wikipedia summary in one click, and save your findings to a personal vocabulary library.

<br/>

![Glimpse](https://img.shields.io/badge/version-1.0.0-639922?style=for-the-badge)
![Manifest](https://img.shields.io/badge/manifest-v3-46d160?style=for-the-badge)
![Platform](https://img.shields.io/badge/YouTube-only-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-555?style=for-the-badge)

---

## ✨ Features

### 🔍 Instant Word Lookup
- **Select any word** on a YouTube page — a lightweight Glimpse tooltip appears instantly
- **Dictionary definitions** via the Free Dictionary API (with part-of-speech labels)
- **Wikipedia summaries** pulled in parallel — no waiting, no tab-switching
- **YouTube subtitle support** — click directly on a caption word to look it up

### 📖 Save & Organize
- **Save words** with one click — definitions and Wikipedia links are stored alongside each entry
- **Search your library** — filter saved words in real time from the popup
- **Open Wikipedia** for any saved word with a single click
- **Export as JSON** — take your vocabulary list anywhere
- Free plan supports up to **20 saved words**; upgrade for unlimited

### 💚 Freemium Model
- Visual progress bar shows how many of your 20 free saves are used
- Color-coded usage indicator: green → amber → red as you approach the limit
- Pro upgrade link built in for when you're ready to go unlimited

---

## 📁 Project Structure

```
glimpse/
├── src/
│   ├── background.js    # Service worker — storage init, upgrade tab handler
│   ├── content.js       # Injected into YouTube — tooltip, panel, API fetching, note saving
│   └── styles.css       # Styles for tooltip and floating panel
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup.html           # Extension popup — saved word library UI
├── popup.js             # Popup logic — render, search, delete, export
└── manifest.json        # Chrome Extension Manifest v3
```

---

## 🚀 Installation (Developer Mode)

1. **Clone this repository**
   ```bash
   git clone https://github.com/MuhammedlFatih/glimpse.git
   cd glimpse
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (top-right toggle)

4. Click **"Load unpacked"** and select the `glimpse/` folder

5. Navigate to any YouTube video, select a word, and click the Glimpse tooltip

---

## 🛠️ How It Works

### Architecture

```
┌─────────────┐     messages      ┌──────────────────┐
│   popup.js  │                   │  background.js   │
│ (library UI)│                   │ (service worker) │
└─────────────┘                   └──────────────────┘
       │                                   │
  chrome.storage.local               storage init +
  (read saved notes)               upgrade tab handler
                                           │
                              ┌────────────────────────┐
                              │      content.js        │
                              │  (injected on YouTube) │
                              │                        │
                              │  mouseup → tooltip     │
                              │  click → panel         │
                              │  API fetch → render    │
                              │  save → storage        │
                              └────────────────────────┘
```

### Lookup Pipeline

When a word is selected, Glimpse fires two API requests **in parallel**:

```
word selected
     │
     ├──► Free Dictionary API  →  definition + part of speech
     │    api.dictionaryapi.dev
     │
     └──► Wikipedia REST API   →  2-sentence summary + article URL
          en.wikipedia.org/api/rest_v1
```

Both results race to the panel — whichever resolves first appears immediately, with no blocking between them.

### YouTube Subtitle Click

For caption segments, Glimpse uses `Range` to calculate which word was clicked based on the `clientX` position, so you can look up words directly from subtitles without selecting text manually.

---

## 🎨 UI Components

| Component | Description |
|---|---|
| **Tooltip** | Minimal floating label that appears above selected text |
| **Lookup Panel** | Fixed right-side panel with definition, Wikipedia summary, save & link buttons |
| **Freemium Bar** | Color-coded usage indicator with upgrade CTA |
| **Popup Library** | Searchable list of saved words with delete, export, and Wikipedia open actions |

---

## 🔐 Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Store saved words, note count, and Pro status locally |
| `activeTab` | Interact with the current YouTube tab |
| `host_permissions` (Dictionary API) | Fetch word definitions |
| `host_permissions` (Wikipedia API) | Fetch article summaries |

> Glimpse stores all data **locally** via `chrome.storage.local`. No data is ever sent to external servers beyond the two public read-only APIs listed above.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Test your changes on YouTube
4. Commit: `git commit -m "feat: add my feature"`
5. Push and open a Pull Request

### Ideas for Contributions
- [ ] Firefox (Manifest v2) port
- [ ] Support for additional languages (Dictionary API supports many)
- [ ] Flashcard / spaced repetition mode for saved words
- [ ] Highlight previously looked-up words on subtitles
- [ ] CSV export option

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  Built for curious minds who learn by watching.
</p>
