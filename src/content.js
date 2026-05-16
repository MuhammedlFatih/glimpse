/* ══════════════════════════════════════════
   GLIMPSE — content.js  (English only)
   ══════════════════════════════════════════ */

/* ── 1. DURUM ── */
let selectedText  = '';
let tooltipEl     = null;
let panelEl       = null;
let currentWikiUrl = '';
const FREE_LIMIT  = 20;

/* ══════════════════════════════════════════
   2. OLAY DİNLEYİCİLERİ
   ══════════════════════════════════════════ */
document.addEventListener('mouseup', (e) => {
  if (isInsideGlimpse(e.target)) return;
  const text = window.getSelection().toString().trim();
  if (!text || text.length > 60 || text.split(' ').length > 4) {
    removeTooltip();
    return;
  }
  selectedText = text;
  const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
  showTooltip(rect);
});

document.addEventListener('mousedown', (e) => {
  if (isInsideGlimpse(e.target)) return;
  removeTooltip();
  removePanel();
});

// YouTube altyazısına tıklama
document.addEventListener('click', (e) => {
  const seg = e.target.closest('.ytp-caption-segment');
  if (!seg) return;
  const word = getWordAtPoint(seg, e.clientX, e.clientY);
  if (!word) return;
  selectedText = word;
  showTooltip(seg.getBoundingClientRect());
});

function isInsideGlimpse(target) {
  return (tooltipEl && tooltipEl.contains(target)) ||
         (panelEl   && panelEl.contains(target));
}

/* ══════════════════════════════════════════
   3. ALTYAZI: TIKLANAN KELİMEYİ BUL
   ══════════════════════════════════════════ */
function getWordAtPoint(el, x, y) {
  const text     = el.textContent;
  const words    = text.trim().split(/\s+/);
  const textNode = el.firstChild;
  if (!textNode) return cleanWord(words[0]);

  const range = document.createRange();
  let charIndex = 0;
  for (const word of words) {
    const start = text.indexOf(word, charIndex);
    const end   = start + word.length;
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const r = range.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return cleanWord(word);
    }
    charIndex = end;
  }
  const elRect = el.getBoundingClientRect();
  const idx    = Math.floor((x - elRect.left) / elRect.width * words.length);
  return cleanWord(words[Math.min(idx, words.length - 1)]);
}

function cleanWord(word = '') {
  return word.replace(/[^a-zA-Z'-]/g, '').trim();
}

/* ══════════════════════════════════════════
   4. TOOLTIP
   ══════════════════════════════════════════ */
function showTooltip(rect) {
  removeTooltip();
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'glimpse-tooltip';
  tooltipEl.innerHTML = `<span class="glimpse-dot"></span>Glimpse`;
  tooltipEl.style.top  = `${rect.top  + window.scrollY - 38}px`;
  tooltipEl.style.left = `${rect.left + window.scrollX}px`;
  tooltipEl.addEventListener('click', () => {
    removeTooltip();
    openPanel(selectedText);
  });
  document.body.appendChild(tooltipEl);
}

function removeTooltip() {
  tooltipEl?.remove();
  tooltipEl = null;
}

/* ══════════════════════════════════════════
   5. PANEL
   ══════════════════════════════════════════ */
function openPanel(word) {
  removePanel();
  panelEl = document.createElement('div');
  panelEl.id = 'glimpse-panel';
  panelEl.innerHTML = buildPanelHTML(word);
  document.body.appendChild(panelEl);

  panelEl.querySelector('.glimpse-close')
    .addEventListener('click', removePanel);
  panelEl.querySelector('.glimpse-btn-save')
    .addEventListener('click', () => saveNote(word));
  panelEl.querySelector('.glimpse-upgrade-btn')
    .addEventListener('click', () => chrome.runtime.sendMessage({ type: 'OPEN_UPGRADE' }));

  fetchDefinitions(word);
  renderNotes();
  updateFreeBar();
}

function removePanel() {
  panelEl?.remove();
  panelEl = null;
}

function buildPanelHTML(word) {
  return `
    <div class="glimpse-header">
      <div class="glimpse-brand">
        <div class="glimpse-logo">
          <svg viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#3B6D11" stroke-width="1.2"/>
            <circle cx="6" cy="6" r="1.8" fill="#3B6D11"/>
          </svg>
        </div>
        <span class="glimpse-brand-name">Glimpse</span>
      </div>
      <button class="glimpse-close" aria-label="Close">✕</button>
    </div>

    <div class="glimpse-word-section">
      <p class="glimpse-word">${escapeHTML(word)}</p>
    </div>

    <div class="glimpse-dict">
      <div class="glimpse-loading">
        <div class="glimpse-spinner"></div>
        Looking up...
      </div>
    </div>

    <div class="glimpse-wiki"></div>

    <div class="glimpse-actions" style="display:none;">
      <button class="glimpse-btn-save">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2v8M2 6h8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Save
      </button>
      <a class="glimpse-btn-wiki" target="_blank" href="#">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7 2h3v3M10 2L6.5 5.5M5 3H3a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V7"
            stroke="#444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Wikipedia
      </a>
    </div>

    <div class="glimpse-notes">
      <div class="glimpse-notes-label">
        Saved
        <span class="glimpse-note-count">0 / ${FREE_LIMIT}</span>
      </div>
      <div class="glimpse-notes-list"></div>
    </div>

    <div class="glimpse-free-bar">
      <div class="glimpse-free-track">
        <div class="glimpse-free-fill" style="width:0%"></div>
      </div>
      <span class="glimpse-free-text">0/${FREE_LIMIT} free</span>
      <button class="glimpse-upgrade-btn">Upgrade</button>
    </div>
  `;
}

/* ══════════════════════════════════════════
   6. TANIM ÇEKME
   Free Dictionary API + Wikipedia paralel çalışır
   ══════════════════════════════════════════ */
async function fetchDefinitions(word) {
  // İkisine paralel istek at — kullanıcı beklemez
  const [dictResult, wikiResult] = await Promise.allSettled([
    fetchDictionary(word),
    fetchWikipedia(word)
  ]);

  const dict = dictResult.status === 'fulfilled' ? dictResult.value : null;
  const wiki = wikiResult.status === 'fulfilled' ? wikiResult.value : null;

  const dictEl = panelEl?.querySelector('.glimpse-dict');
  const wikiEl = panelEl?.querySelector('.glimpse-wiki');
  if (!dictEl) return;

  // ── Sözlük tanımı ──
  if (dict) {
    // Kelime türünü göster
    const wordSection = panelEl?.querySelector('.glimpse-word-section');
    if (wordSection && dict.partOfSpeech && !wordSection.querySelector('.glimpse-word-type')) {
      const typeEl = document.createElement('span');
      typeEl.className   = 'glimpse-word-type';
      typeEl.textContent = dict.partOfSpeech;
      wordSection.appendChild(typeEl);
    }
    dictEl.innerHTML = `
      <div class="glimpse-wiki-label">Dictionary</div>
      <p>${escapeHTML(dict.definition)}</p>
    `;
  } else if (!wiki) {
    // İkisi de boşsa
    dictEl.innerHTML = `<p style="color:#999;font-size:12px;">No definition found.</p>`;
  } else {
    // Sadece wiki var, dict boş
    dictEl.innerHTML = '';
  }

  // ── Wikipedia özeti ──
  if (wiki && wikiEl) {
    wikiEl.style.display = 'block';
    wikiEl.innerHTML = `
      <div class="glimpse-wiki-label">Wikipedia</div>
      <p>${escapeHTML(wiki.summary)}</p>
    `;
    currentWikiUrl = wiki.url;
    const wikiBtn = panelEl?.querySelector('.glimpse-btn-wiki');
    if (wikiBtn) wikiBtn.href = wiki.url;
  }

  // Butonları göster (en az biri varsa)
  if (dict || wiki) {
    panelEl?.querySelector('.glimpse-actions')?.style.setProperty('display', 'flex');
    // Wikipedia butonu sadece wiki varsa görünür
    if (!wiki) {
      panelEl?.querySelector('.glimpse-btn-wiki')?.style.setProperty('display', 'none');
    }
  }
}

/* ── Free Dictionary API ── */
async function fetchDictionary(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    const entry    = data[0];
    const meaning  = entry.meanings?.[0];
    if (!meaning) return null;

    const definition = meaning.definitions?.[0]?.definition;
    if (!definition) return null;

    return {
      definition,
      partOfSpeech: meaning.partOfSpeech || ''
    };
  } catch {
    return null;
  }
}

/* ── Wikipedia EN ── */
async function fetchWikipedia(word) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Disambiguation sayfalarını geç
    if (data.type === 'disambiguation') return null;

    // extract'ın ilk 2 cümlesini al — ne çok kısa ne çok uzun
    const sentences = data.extract?.split(/(?<=[.!?])\s+/) || [];
    const summary   = sentences.slice(0, 2).join(' ').trim();
    if (!summary) return null;

    return {
      summary,
      url: data.content_urls?.desktop?.page
           || `https://en.wikipedia.org/wiki/${encodeURIComponent(word)}`
    };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   7. NOT KAYDETME
   ══════════════════════════════════════════ */
async function saveNote(word) {
  const { notes = [], saveCount = 0, isPro = false } =
    await chrome.storage.local.get(['notes', 'saveCount', 'isPro']);

  if (!isPro && saveCount >= FREE_LIMIT) { showUpgradePrompt(); return; }

  if (notes.find(n => n.word.toLowerCase() === word.toLowerCase())) {
    const btn = panelEl?.querySelector('.glimpse-btn-save');
    if (btn) { btn.textContent = 'Already saved'; btn.disabled = true; }
    return;
  }

  // Hem sözlük tanımını hem wiki özetini kaydet
  const dictDef  = panelEl?.querySelector('.glimpse-dict p')?.textContent  || '';
  const wikiSum  = panelEl?.querySelector('.glimpse-wiki p')?.textContent  || '';
  const definition = dictDef || wikiSum;

  await chrome.storage.local.set({
    notes:     [{ id: Date.now(), word, definition, wikiUrl: currentWikiUrl, savedAt: new Date().toISOString() }, ...notes],
    saveCount: saveCount + 1
  });

  const btn = panelEl?.querySelector('.glimpse-btn-save');
  if (btn) { btn.textContent = 'Saved ✓'; btn.disabled = true; }

  renderNotes();
  updateFreeBar();
}

/* ══════════════════════════════════════════
   8. NOT LİSTESİ
   ══════════════════════════════════════════ */
async function renderNotes() {
  const { notes = [] } = await chrome.storage.local.get(['notes']);
  const listEl  = panelEl?.querySelector('.glimpse-notes-list');
  const countEl = panelEl?.querySelector('.glimpse-note-count');
  if (!listEl) return;

  if (countEl) countEl.textContent = `${notes.length} / ${FREE_LIMIT}`;
  listEl.innerHTML = notes.length === 0
    ? `<p class="glimpse-empty-notes">No saved words yet.</p>`
    : notes.slice(0, 3).map(n => `
        <div class="glimpse-note-item" data-id="${n.id}">
          <p class="glimpse-note-word">${escapeHTML(n.word)}<button class="glimpse-note-delete" data-id="${n.id}">✕</button></p>
          <p class="glimpse-note-preview">${escapeHTML(n.definition)}</p>
        </div>`).join('');
  
  listEl.querySelectorAll('.glimpse-note-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const { notes = [], saveCount = 0 } = await chrome.storage.local.get(['notes', 'saveCount']);
      await chrome.storage.local.set({
        notes:     notes.filter(n => n.id !== id),
        saveCount: Math.max(0, saveCount - 1)
      });
      renderNotes();
      updateFreeBar();
    });
  });
}

/* ══════════════════════════════════════════
   9. FREEMIUM ÇUBUĞU
   ══════════════════════════════════════════ */
async function updateFreeBar() {
  const { saveCount = 0, isPro = false } =
    await chrome.storage.local.get(['saveCount', 'isPro']);

  const fillEl = panelEl?.querySelector('.glimpse-free-fill');
  const textEl = panelEl?.querySelector('.glimpse-free-text');

  if (textEl) textEl.textContent = isPro ? 'Pro — unlimited' : `${saveCount}/${FREE_LIMIT} free`;
  if (fillEl) {
    const pct = Math.min((saveCount / FREE_LIMIT) * 100, 100);
    fillEl.style.width      = `${pct}%`;
    fillEl.style.background = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#BA7517' : '#639922';
  }
}

/* ══════════════════════════════════════════
   10. YÜKSELT MESAJI
   ══════════════════════════════════════════ */
function showUpgradePrompt() {
  const defEl = panelEl?.querySelector('.glimpse-dict');
  if (defEl) defEl.innerHTML = `
    <p style="color:#854F0B;font-size:12px;line-height:1.6;">
      You've reached the free limit (${FREE_LIMIT} words).<br>
      Upgrade to Pro for unlimited saves.
    </p>`;

  const btn = panelEl?.querySelector('.glimpse-btn-save');
  if (btn) {
    btn.textContent      = 'Upgrade to Pro';
    btn.disabled         = false;
    btn.style.background = '#BA7517';
    btn.onclick = () => chrome.runtime.sendMessage({ type: 'OPEN_UPGRADE' });
  }
}

/* ══════════════════════════════════════════
   11. XSS KORUMASI
   ══════════════════════════════════════════ */
function escapeHTML(str = '') {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
