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

document.addEventListener('DOMContentLoaded', initOptions);
