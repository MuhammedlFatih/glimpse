const FREE_LIMIT = 20;
let allNotes = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  bindSearch();
  bindExport();
  bindUpgrade();
});

/* ── Verileri yükle ── */
async function loadData() {
  const { notes = [], saveCount = 0, isPro = false } =
    await chrome.storage.local.get(['notes', 'saveCount', 'isPro']);

  allNotes = notes;
  renderNotes(notes);
  updateFooter(saveCount, isPro);

  if (isPro) {
    document.getElementById('pro-badge').style.display  = 'inline';
    document.getElementById('upgrade-btn').style.display = 'none';
  }

  const countEl = document.getElementById('note-count');
  if (countEl) countEl.textContent = notes.length > 0 ? `${notes.length} saved` : '';
}

/* ── Notları render et ── */
function renderNotes(notes) {
  const listEl = document.getElementById('notes-list');

  if (notes.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="#639922" stroke-width="1.3"/>
            <circle cx="9" cy="9" r="2.5" fill="#639922"/>
          </svg>
        </div>
        <p>No saved words yet.<br/>Select a word on YouTube and open with Glimpse.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = notes.map(note => `
    <div class="note-item" data-id="${note.id}">
      <div class="note-word">${escapeHTML(note.word)}</div>
      <div class="note-def">${escapeHTML(note.definition)}</div>
      <div class="note-date">${formatDate(note.savedAt)}</div>
      <button class="delete-btn" data-id="${note.id}" title="Delete">✕</button>
    </div>`).join('');

  // Wikipedia'yı aç
  listEl.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) return;
      const note = allNotes.find(n => n.id === parseInt(item.dataset.id));
      if (note?.wikiUrl) chrome.tabs.create({ url: note.wikiUrl });
    });
  });

  // Sil
  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteNote(parseInt(btn.dataset.id)));
  });
}

/* ── Not sil ── */
async function deleteNote(id) {
  const { notes = [], saveCount = 0 } = await chrome.storage.local.get(['notes', 'saveCount']);
  const updated = notes.filter(n => n.id !== id);
  const newCount = Math.max(0, saveCount - 1);

  await chrome.storage.local.set({ notes: updated, saveCount: newCount });

  allNotes = updated;
  renderNotes(updated);
  updateFooter(newCount, false);

  const countEl = document.getElementById('note-count');
  if (countEl) countEl.textContent = updated.length > 0 ? `${updated.length} saved` : '';
}

/* ── Arama ── */
function bindSearch() {
  document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderNotes(q
      ? allNotes.filter(n =>
          n.word.toLowerCase().includes(q) ||
          n.definition.toLowerCase().includes(q))
      : allNotes);
  });
}

/* ── Dışa aktar ── */
function bindExport() {
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `glimpse-notes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ── Yükselt ── */
function bindUpgrade() {
  document.getElementById('upgrade-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://glimpse.so/upgrade' });
  });
}

/* ── Footer ── */
function updateFooter(saveCount, isPro) {
  const fillEl = document.getElementById('free-fill');
  const textEl = document.getElementById('free-text');

  if (isPro) {
    if (fillEl) { fillEl.style.width = '100%'; fillEl.style.background = '#639922'; }
    if (textEl) textEl.textContent = 'Pro — unlimited';
    return;
  }

  const pct = Math.min((saveCount / FREE_LIMIT) * 100, 100);
  if (fillEl) {
    fillEl.style.width      = `${pct}%`;
    fillEl.style.background = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#BA7517' : '#639922';
  }
  if (textEl) textEl.textContent = `${saveCount}/${FREE_LIMIT} free`;
}

/* ── Yardımcılar ── */
function escapeHTML(str = '') {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
