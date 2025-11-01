const STORAGE_KEY = 'lunchRatings';
const SKIP_NAMES = new Set(['Dovolená', 'Státní svátek']);

async function getRatings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

async function saveRatings(ratings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: ratings });
}

async function makeButton(iconFile, altText, active, type) {
  const url = chrome.runtime.getURL(`icons/${iconFile}`);
  const res = await fetch(url);
  const svgText = await res.text();

  const wrapper = document.createElement('span');
  wrapper.className = `lunch-rater-button ${type}`;
  if (active) wrapper.classList.add('lunch-rater-on');
  wrapper.innerHTML = svgText;

  const svg = wrapper.querySelector('svg');
  svg.setAttribute('aria-label', altText);
  svg.setAttribute('role', 'img');

  return wrapper;
}

async function initRater() {
  const ratings = await getRatings();

  document.querySelectorAll('div.offer table').forEach(table => {
    table.querySelectorAll('tr').forEach(async row => {
      if (row.dataset.raterInjected) return;

      const nameCell = row.querySelector('td.nazevjidla');
      if (!nameCell) return;

      const dishName = nameCell.textContent.trim();
      if (!dishName || SKIP_NAMES.has(dishName)) return;
      row.dataset.raterInjected = '1';

      let textSpan = nameCell.querySelector('.lunch-rater-text');
      if (!textSpan) {
        textSpan = document.createElement('span');
        textSpan.className = 'lunch-rater-text';
        textSpan.textContent = dishName;
        nameCell.textContent = '';
        nameCell.appendChild(textSpan);
      }

      const current = ratings[dishName] || 0;
      textSpan.classList.toggle('lunch-rater-bold',  current ===  1);
      textSpan.classList.toggle('lunch-rater-strike', current === -1);
      textSpan.classList.toggle('lunch-rater-neutral', current === 0.5);

      const ctrlTd = document.createElement('td');
      ctrlTd.className = 'lunch-rater-controls-cell';

      const upBtn     = await makeButton('thumb_up.svg',   'Like',    current ===  1,   'like');
      const neutralBtn = await makeButton('neutral.svg',   'Neutral', current === 0.5, 'neutral');
      const downBtn   = await makeButton('thumb_down.svg', 'Dislike', current === -1,  'dislike');

      upBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const fresh = await getRatings();
        const was   = fresh[dishName] || 0;
        const now   = was === 1 ? 0 : 1;
        if (now === 0) delete fresh[dishName]; else fresh[dishName] = now;
        await saveRatings(fresh);

        upBtn.classList.toggle('lunch-rater-on', now === 1);
        neutralBtn.classList.remove('lunch-rater-on');
        downBtn.classList.remove('lunch-rater-on');
        textSpan.classList.toggle('lunch-rater-bold', now === 1);
        textSpan.classList.remove('lunch-rater-neutral');
        textSpan.classList.remove('lunch-rater-strike');
      });

      neutralBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const fresh = await getRatings();
        const was   = fresh[dishName] || 0;
        const now   = was === 0.5 ? 0 : 0.5;
        if (now === 0) delete fresh[dishName]; else fresh[dishName] = now;
        await saveRatings(fresh);

        neutralBtn.classList.toggle('lunch-rater-on', now === 0.5);
        upBtn.classList.remove('lunch-rater-on');
        downBtn.classList.remove('lunch-rater-on');
        textSpan.classList.toggle('lunch-rater-neutral', now === 0.5);
        textSpan.classList.remove('lunch-rater-bold');
        textSpan.classList.remove('lunch-rater-strike');
      });

      downBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const fresh = await getRatings();
        const was   = fresh[dishName] || 0;
        const now   = was === -1 ? 0 : -1;
        if (now === 0) delete fresh[dishName]; else fresh[dishName] = now;
        await saveRatings(fresh);

        downBtn.classList.toggle('lunch-rater-on', now === -1);
        upBtn.classList.remove('lunch-rater-on');
        neutralBtn.classList.remove('lunch-rater-on');
        textSpan.classList.toggle('lunch-rater-strike', now === -1);
        textSpan.classList.remove('lunch-rater-bold');
        textSpan.classList.remove('lunch-rater-neutral');
      });

      ctrlTd.append(upBtn, neutralBtn, downBtn);
      row.appendChild(ctrlTd);
    });
  });
}

window.addEventListener('DOMContentLoaded', initRater);
new MutationObserver(initRater).observe(document.body, { childList: true, subtree: true });
