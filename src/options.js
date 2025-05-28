const STORAGE_KEY = 'lunchRatings';

async function getRatings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

async function saveRatings(ratings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: ratings });
}

function renderList(containerId, items, emptyMsgId, onRemove) {
  const ul = document.getElementById(containerId);
  const emptyMsg = document.getElementById(emptyMsgId);

  ul.innerHTML = '';
  if (items.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  items.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;

    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.className = 'remove';
    btn.addEventListener('click', () => onRemove(name));

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

async function initOptions() {
  const ratings = await getRatings();
  const liked    = [];
  const disliked = [];

  for (const [name, value] of Object.entries(ratings)) {
    if (value === 1)  liked.push(name);
    if (value === -1) disliked.push(name);
  }

  renderList('liked-list',    liked,    'no-liked',    removeFromLiked);
  renderList('disliked-list', disliked, 'no-disliked', removeFromDisliked);
}

async function removeFromLiked(name) {
  const ratings = await getRatings();
  delete ratings[name];
  await saveRatings(ratings);
  initOptions();  // re-render
}

async function removeFromDisliked(name) {
  const ratings = await getRatings();
  delete ratings[name];
  await saveRatings(ratings);
  initOptions();  // re-render
}

document.addEventListener('DOMContentLoaded', () => {
  initOptions();

  const newItemInput    = document.getElementById('new-item-input');
  const addLikedBtn     = document.getElementById('add-liked-btn');
  const addDislikedBtn  = document.getElementById('add-disliked-btn');

  addLikedBtn.addEventListener('click', async () => {
    const name = newItemInput.value.trim();
    if (!name) return;
    const ratings = await getRatings();
    ratings[name] = 1;
    await saveRatings(ratings);
    newItemInput.value = '';
    initOptions();
  });

  addDislikedBtn.addEventListener('click', async () => {
    const name = newItemInput.value.trim();
    if (!name) return;
    const ratings = await getRatings();
    ratings[name] = -1;
    await saveRatings(ratings);
    newItemInput.value = '';
    initOptions();
  });

  // NEW: export/import controls
  const exportBtn   = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');

  exportBtn.addEventListener('click', async () => {
    const ratings = await getRatings();
    const blob    = new Blob([JSON.stringify(ratings, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = 'lunchRatings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let imported;
    try {
      imported = JSON.parse(text);
    } catch {
      alert('Invalid JSON file');
      return;
    }
    // overwrite existing ratings
    await saveRatings(imported);
    initOptions();
    importInput.value = '';
  });
});
