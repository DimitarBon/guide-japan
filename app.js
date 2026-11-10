// Japan 2026 trip guide — renders pages from data/*.json
const $ = s => document.querySelector(s);
const view = $('#view');
const cache = {};

// ---------- Language (EN / БГ) ----------
// Bulgarian lives in data/bg/ (same paths as data/) as a one-off snapshot: English updates never touch it.
// Anything without a Bulgarian version falls back to English. Interface strings are in BG below.
const BG = {
  '← Back':'← Назад','Yes':'Да','Cancel':'Отказ','✅ Booked':'✅ Резервирано','⚠️ To book':'⚠️ За резервиране','✔️ Done':'✔️ Готово',
  '✅ Included':'✅ Включено','❓ Optional':'❓ По избор','🌦️ If weather':'🌦️ Ако времето позволи','❌ Not included':'❌ Не е включено',
  'Map ↗':'Карта ↗','Backups:':'Резервни:','est., verify':'прибл., провери','Optional':'По избор','📿 stamp':'📿 печат',
  '🧠 Trivia to check today':'🧠 Любопитни факти за днес','pace:':'темпо:',
  '🕘 Hours':'🕘 Работно време','💴 Price':'💴 Цена','⌛ Time there':'⌛ Време там','🚉 Getting there':'🚉 Как се стига','🎫 Booking':'🎫 Резервация','📋 Status':'📋 Статус',
  '👀 What to see':'👀 Какво да видиш','🚶 How to walk it':'🚶 Маршрут','Enter:':'Вход:','Exit:':'Изход:','🧠 Facts':'🧠 Факти','💡 Tips':'💡 Съвети','🧠 Trivia':'🧠 Любопитни факти',
  'Checked':'Проверено на','Verify before going.':'Провери преди да отидеш.',
  '↩️ Reopen':'↩️ Върни','Reopen this place (back to pending)?':'Да върна ли мястото в чакащи?','✔️ Mark as done':'✔️ Отбележи като готово','Mark this place as done?':'Да отбележа ли мястото като посетено?',
  'More ›':'Още ›','🔎 Check it on the trip':'🔎 Провери по време на пътуването','📍 Related places':'📍 Свързани места',
  'of':'от','places':'места','All':'Всички','⏳ Pending':'⏳ Чакащи','No places match these filters':'Няма места по тези филтри','🔍 Search all places':'🔍 Търси във всички места','Search results':'Резултати',
  'Bookings':'Резервации','Booked':'Резервирани','To book':'За резервиране','Passed':'Минали','All cities':'Всички градове','Sorted by date and time. No PINs are stored.':'Подредени по дата и час. Не се пазят PIN кодове.','Nothing here':'Няма нищо тук',
  'ticket':'билет','tickets':'билета','Details ›':'Детайли ›',
  '✅ Mark as booked':'✅ Отбележи като резервирано','Mark this as booked?':'Да отбележа ли като резервирано?','Mark this booking as done?':'Да отбележа ли резервацията като минала?','Reopen this booking (back to Booked)?':'Да върна ли резервацията в „Резервирани“?',
  '📅 When':'📅 Кога','🏢 Provider':'🏢 Доставчик','🔖 Reference':'🔖 Номер','👥 People':'👥 Хора','📍 Meet':'📍 Среща','🏁 Ends':'🏁 Край','↩️ Cancel':'↩️ Отказване','📱 Voucher':'📱 Ваучер','📞 How to book':'📞 Как се резервира','🔁 Fallback':'🔁 Резервен вариант','⏰ Book by':'⏰ Резервирай до',
  '🎟️ Tickets':'🎟️ Билети','tap to enlarge':'докосни за уголемяване','Open in the day plan':'Отвори в плана за деня',
  'Flights':'Полети','Stays':'Настаняване','Transfers between bases':'Преходи между базите','Trivia':'Любопитни факти','Useful phrases':'Полезни фрази','Emergency':'Спешни случаи','Packing':'Багаж','Before departure':'Преди заминаване',
  '📅 Dates':'📅 Дати','📍 Address':'📍 Адрес','📞 Phone':'📞 Телефон','🕒 Times':'🕒 Часове','🔖 Booking':'🔖 Резервация','ℹ️ Extra':'ℹ️ Допълнително','🚆 How':'🚆 Как','🧳 Luggage':'🧳 Багаж',
  'Ticks are saved only in this browser.':'Отметките се пазят само в този браузър.','Info':'Инфо','Tap a section to open it.':'Докосни раздел, за да го отвориш.',
  'Japan in general':'Япония като цяло','Tokyo':'Tokyo','Kyoto, Himeji and Uji':'Kyoto, Himeji и Uji','Yoshino':'Yoshino','Osaka and Nara':'Osaka и Nara','🔊 plays the phrase, 🐢 plays it slowly.':'🔊 пуска фразата, 🐢 я пуска бавно.',
  'Days':'Дни','Places':'Места','10–23 Nov · Tokyo · Kyoto · Yoshino · Osaka':'10–23 ноември · Tokyo · Kyoto · Yoshino · Osaka'
};
let lang = 'en';
try { if (localStorage.getItem('jp-lang') === 'bg') lang = 'bg'; } catch {}
const L = s => (lang === 'bg' && BG[s]) || s;
let STATUS, INC;
const TAB_LABELS = { days: 'Days', places: 'Places', bookings: 'Bookings', info: 'Info' };
function applyLang() {
  document.documentElement.lang = lang;
  STATUS = {
    booked: `<span class="badge ok">${L('✅ Booked')}</span>`,
    todo: `<span class="badge todo">${L('⚠️ To book')}</span>`,
    done: `<span class="badge done">${L('✔️ Done')}</span>`
  };
  INC = { yes: L('✅ Included'), maybe: L('❓ Optional'), weather: L('🌦️ If weather'), no: L('❌ Not included') };
  $('#page-sub').textContent = L('10–23 Nov · Tokyo · Kyoto · Yoshino · Osaka');
  document.querySelectorAll('.tabs a').forEach(a => { a.lastElementChild.textContent = L(TAB_LABELS[a.dataset.tab]); });
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
}
const langBox = document.createElement('div');
langBox.className = 'lang';
langBox.innerHTML = '<button data-lang="en">EN</button><button data-lang="bg">БГ</button>';
$('.top').prepend(langBox);
langBox.addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (!b || b.dataset.lang === lang) return;
  lang = b.dataset.lang;
  try { localStorage.setItem('jp-lang', lang); } catch {}
  applyLang();
  route();
});
applyLang();

const fetchJson = path => fetch(path, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
async function loadFor(l, path) {
  const en = await fetchJson(path);
  if (l !== 'bg' || !path.startsWith('data/')) return en;
  const bg = await fetchJson(path.replace('data/', 'data/bg/'));
  return bg ? { ...en, ...bg } : en;
}
async function load(path) {
  const key = lang + ':' + path;
  if (!cache[key]) cache[key] = loadFor(lang, path);
  return cache[key];
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const placeholder = text => `<div class="card placeholder">${esc(text)}</div>`;

// ---------- Modal ----------
// A small stack, so a place opened from a trivia item (or the reverse) has a Back button
const stack = [];
function openModal(html, push = true) {
  if (push && !$('#modal').hidden) stack.push($('#modal-body').innerHTML);
  if (!push) stack.length = 0;
  $('#modal-body').innerHTML = (stack.length ? `<button class="back">${L('← Back')}</button>` : '') + html;
  $('#modal').hidden = false;
  $('.sheet').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
// Re-draw the open sheet in place (after a status change), keeping the Back stack
function refreshModal(html) {
  $('#modal-body').innerHTML = (stack.length ? `<button class="back">${L('← Back')}</button>` : '') + html;
}
function closeModal() {
  stack.length = 0;
  $('#modal').hidden = true;
  document.body.style.overflow = '';
}
$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal' || e.target.closest('.close')) return closeModal();
  if (e.target.closest('.back')) { $('#modal-body').innerHTML = stack.pop(); return; }
  const pl = e.target.closest('.place');
  if (pl) return showPlace(pl.dataset.code);
  const tr = e.target.closest('.trivia');
  if (tr) return showTrivia(tr.dataset.id);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---------- Per-browser state (marks survive page updates; lost only if browser data is cleared) ----------
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const placeDone = code => !!store.get('jp-place-done')[code];
// Booking status: the data says booked / todo; marks on this phone can move it to booked / done
async function bkStatus(id, fallback) {
  const mark = store.get('jp-bk-status')[id];
  if (mark) return mark;
  const b = await load('data/bookings.json') || {};
  if ((b.booked || []).some(x => x.id === id)) return 'booked';
  if ((b.todo || []).some(x => x.id === id)) return 'todo';
  return fallback;
}
// Keep the page behind the sheet in sync after a mark, without jumping the scroll
async function rerenderPage() {
  const y = window.scrollY;
  await pages[currentTab]?.(true);
  window.scrollTo(0, y);
}
// Two-step confirm inside the sheet (browser dialogs may be blocked in the frame)
function confirmBtn(act, arg, label, question) {
  return `<div class="act"><button class="btn" data-ask="${esc(question)}" data-act="${act}" data-arg="${esc(arg)}">${label}</button></div>`;
}
document.addEventListener('click', async e => {
  const ask = e.target.closest('[data-ask]');
  if (ask) {
    const box = ask.parentElement;
    box.innerHTML = `<p><b>${esc(ask.dataset.ask)}</b></p>
      <button class="btn" data-yes="${esc(ask.dataset.act)}" data-arg="${esc(ask.dataset.arg)}">${L('Yes')}</button>
      <button class="btn ghost" data-no>${L('Cancel')}</button>`;
    box.dataset.orig = ask.outerHTML;
    return;
  }
  if (e.target.closest('[data-no]')) {
    const box = e.target.closest('.act'); box.innerHTML = box.dataset.orig; return;
  }
  const yes = e.target.closest('[data-yes]');
  if (!yes) return;
  const [kind, value] = yes.dataset.yes.split(':'), arg = yes.dataset.arg;
  if (kind === 'bk') {
    const s = store.get('jp-bk-status'); s[arg] = value; store.set('jp-bk-status', s);
    await showBooking(arg, true);
  } else if (kind === 'pl') {
    const s = store.get('jp-place-done');
    if (value === 'done') s[arg] = true; else delete s[arg];
    store.set('jp-place-done', s);
    await showPlace(arg, true);
  }
  rerenderPage();
});

// ---------- Pages ----------
let currentDay = null;   // set to today on the first open / reload, then kept while the page is open
let currentTab = 'days';
const P = { 1: '🟢 P1', 2: '🟡 P2', 3: '⚪ P3' };

// Places: one file per base, picked by code prefix (T, K, Y, O, H)
async function getPlace(code) {
  const trip = await load('data/trip.json');
  const file = trip?.placeFiles?.[code[0]];
  const all = file ? await load(`data/${file}.json`) : null;
  return all?.[code] || null;
}
const placeLine = (code, p, label) => p
  ? `<button class="place" data-code="${esc(code)}">${placeDone(code) ? '<span class="donemark">✔️</span> ' : ''}${esc(code)} ${p.icon || ''} <b>${esc(label || p.name)}</b>
       <span class="muted">(${esc(p.desc)} · ${P[p.p] || ''})</span></button>`
  : `<span>${esc(code)}</span>`;
// iPhone on the GitHub site: Map links open the Google Maps app (comgooglemaps://), so the guide stays open.
// If the app does not open within 1.5 s, the web map opens instead. The Claude page blocks app links, so it keeps web links.
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const APP_LINKS = IOS && !/claude\.ai$|claudeusercontent\.com$|claude\.site$/.test(location.hostname);
document.addEventListener('click', e => {
  const a = e.target.closest('a.map');
  if (!a || !APP_LINKS) return;
  let q;
  try { q = new URL(a.href).searchParams.get('query'); } catch (_) { return; }
  if (!q) return;
  e.preventDefault();
  let left = false;
  const away = () => { left = true; };
  document.addEventListener('visibilitychange', away, { once: true });
  window.addEventListener('pagehide', away, { once: true });
  location.href = 'comgooglemaps://?q=' + encodeURIComponent(q);
  setTimeout(() => { if (!left && document.visibilityState === 'visible') location.href = a.href; }, 1500);
});
const mapLink = p => p?.map ? ` <a class="map" href="${esc(p.map)}" target="_blank" rel="noopener">${L('Map ↗')}</a>` : '';

async function renderItem(it) {
  if (it.type === 'head') return `<h3 class="opthead">${esc(it.text)}</h3>`;
  const st = it.status ? (it.booking ? await bkStatus(it.booking, it.status) : it.status) : null;
  if (it.type === 'travel') {
    return `<div class="leg"><span>${it.mode || '→'}</span><div>${it.time ? `<b>${esc(it.time)}</b> ` : ''}${esc(it.text)}
      <div class="meta">⏱ ${esc(it.dur || '')}${it.cost ? ' · ' + esc(it.cost) : ''}${it.est ? ` · <i>${L('est., verify')}</i>` : ''}${st ? ' ' + (it.booking ? `<button class="bk" data-id="${esc(it.booking)}">${STATUS[st]}</button>` : STATUS[st]) : ''}</div></div></div>`;
  }
  const p = it.place ? await getPlace(it.place) : null;
  const time = it.time ? `<div class="time">${esc(it.time)}${it.end ? '<br><span>' + esc(it.end) + '</span>' : ''}</div>` : '<div class="time"></div>';
  const head = it.place ? placeLine(it.place, p, it.label) + mapLink(p)
    : `<b>${it.type === 'meal' ? '🍽️ ' : ''}${esc(it.text)}</b>`;
  const alts = it.alt ? `<div class="meta">${L('Backups:')} ${(await Promise.all(it.alt.map(async c => placeLine(c, await getPlace(c))))).join(' ')}</div>` : '';
  return `<div class="stop ${it.type}${it.place && placeDone(it.place) ? ' done' : ''}"${it.place ? ` data-place="${esc(it.place)}"` : ''}>${time}<div class="body">
      ${it.type === 'optional' ? `<span class="badge opt">${L('Optional')}</span> ` : ''}${head}
      ${it.place && it.text ? `<p>${esc(it.text)}</p>` : ''}
      <div class="meta">${it.stay ? '⌛ ' + esc(it.stay) : ''}${it.stamp ? ' · ' + L('📿 stamp') : ''} ${st ? (it.booking ? `<button class="bk" data-id="${esc(it.booking)}">${STATUS[st]}</button>` : STATUS[st]) : ''}${it.ref ? ' · ' + esc(it.ref) : ''}</div>
      ${alts}</div></div>`;
}

// Today's day from the phone's date: before the trip → Arr, after → Dep
function todayIndex(days) {
  const n = new Date(), pad = x => String(x).padStart(2, '0');
  const today = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  const i = days.findIndex(d => d.date === today);
  if (i >= 0) return i;
  return today < (days[0]?.date || '') ? 0 : days.length - 1;
}
// Day chip colours: one band per place of the day (Tokyo, Himeji, Kyoto, Yoshino, Nara, Osaka)
function chipBg(d, colors, strong) {
  const c = (d.places || []).map(p => colors?.[p]?.[strong ? 1 : 0]).filter(Boolean);
  if (!c.length) return '';
  const w = 100 / c.length;
  return `linear-gradient(90deg,${c.map((x, k) => `${x} ${k * w}% ${(k + 1) * w}%`).join(',')})`;
}
async function renderDays(keepScroll) {
  const trip = await load('data/trip.json');
  const days = trip?.days || [];
  if (currentDay === null) currentDay = todayIndex(days);
  const chips = days.map((d, i) =>
    `<button class="chip${i === currentDay ? ' on' : ''}" data-day="${i}" style="background:${chipBg(d, trip.colors, i === currentDay)}"><b>${esc(d.chip)}</b>${esc(d.label)}</button>`).join('');
  const d = days[currentDay];
  const data = d ? await load(`data/days/${d.file}.json`) : null;
  let body = placeholder('This day is added in step 6');
  if (data) {
    const items = (await Promise.all(data.items.map(renderItem))).join('');
    const trivia = data.trivia?.length ? `<div class="card"><h3>${L('🧠 Trivia to check today')}</h3>${await triviaList(data.trivia)}</div>` : '';
    body = `<div class="card"><h2>${esc(d.chip)} · ${esc(d.label)} · ${esc(data.title)}</h2>
      <p class="muted">${esc(d.base)} · ${L('pace:')} ${esc(data.pace)}${data.stay ? ' · 🛏️ ' + esc(data.stay) : ''}</p></div>
      <div class="timeline">${items}</div>${trivia}`;
  } else if (d) {
    body = `<div class="card"><h2>${esc(d.chip)} · ${esc(d.label)}</h2><p class="muted">${esc(d.base)}</p></div>` + body;
  }
  view.innerHTML = `<div class="chips">${chips}</div>${body}`;
  view.querySelectorAll('.chip').forEach(b =>
    b.addEventListener('click', () => { currentDay = +b.dataset.day; renderDays(); }));
  if (!keepScroll) view.querySelector('.chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  if (focusPlace) {   // jump from the Places list: scroll to the stop and highlight it
    const el = view.querySelector(`.stop[data-place="${focusPlace}"]`) ||
      [...view.querySelectorAll('.stop [data-code]')].find(b => b.dataset.code === focusPlace)?.closest('.stop');
    focusPlace = null;
    if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2500); }
  }
}
let focusPlace = null;

// Place details in the bottom sheet (no page change)
const sec = (title, html) => html ? `<h3>${title}</h3>${html}` : '';
const list = a => a?.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
async function placeHtml(code, p) {
  const r = p.route;
  return `
    <p class="muted">${esc(code)} · ${P[p.p] || ''}${placeDone(code) ? ' · ' + L('✔️ Done') : ''}</p>
    <h2>${p.icon || ''} ${esc(p.name)}</h2>
    <p>${esc(p.desc)}${mapLink(p)}</p>
    ${p.why ? `<p class="why">${esc(p.why)}</p>` : ''}
    <dl class="facts">
      ${p.hours ? `<dt>${L('🕘 Hours')}</dt><dd>${esc(p.hours)}</dd>` : ''}
      ${p.price ? `<dt>${L('💴 Price')}</dt><dd>${esc(p.price)}</dd>` : ''}
      ${p.stay ? `<dt>${L('⌛ Time there')}</dt><dd>${esc(p.stay)}</dd>` : ''}
      ${p.access ? `<dt>${L('🚉 Getting there')}</dt><dd>${esc(p.access)}</dd>` : ''}
      ${p.booking ? `<dt>${L('🎫 Booking')}</dt><dd>${esc(p.booking)}</dd>` : ''}
      <dt>${L('📋 Status')}</dt><dd>${INC[p.inc || 'maybe']}${p.days?.length ? ' · ' + esc(p.days.join(', ')) : ''}${p.decision ? ' · ' + esc(p.decision) : ''}</dd>
    </dl>
    ${sec(L('👀 What to see'), list(p.see))}
    ${r ? sec(L('🚶 How to walk it'), `<p><b>${L('Enter:')}</b> ${esc(r.enter)}</p><ol>${r.walk.map(w => `<li>${esc(w)}</li>`).join('')}</ol><p><b>${L('Exit:')}</b> ${esc(r.exit)}</p>`) : ''}
    ${sec(L('🧠 Facts'), list(p.facts))}
    ${sec(L('💡 Tips'), list(p.tips))}
    ${p.trivia?.length ? sec(L('🧠 Trivia'), await triviaList(p.trivia)) : ''}
    ${p.pending ? `<p class="muted"><i>${esc(p.pending)}</i></p>` : ''}
    ${p.verified ? `<p class="muted small">${L('Checked')} ${esc(p.verified)}. ${L('Verify before going.')}</p>` : ''}`;
}
async function showPlace(code, replace) {
  const p = await getPlace(code);
  if (!p) return;
  const btn = placeDone(code)
    ? confirmBtn('pl:open', code, L('↩️ Reopen'), L('Reopen this place (back to pending)?'))
    : confirmBtn('pl:done', code, L('✔️ Mark as done'), L('Mark this place as done?'));
  const html = await placeHtml(code, p) + btn;
  replace ? refreshModal(html) : openModal(html);
}
// Trivia: stored once in data/trivia.json, linked from days and places
async function triviaList(ids) {
  const all = await load('data/trivia.json') || {};
  return ids.filter(id => all[id]).map(id =>
    `<button class="trivia" data-id="${esc(id)}"><b>${esc(all[id].title)}</b><span>${esc(all[id].summary)}</span><i>${L('More ›')}</i></button>`).join('');
}
async function showTrivia(id) {
  const t = (await load('data/trivia.json') || {})[id];
  if (!t) return;
  const links = t.places?.length
    ? (await Promise.all(t.places.map(async c => { const p = await getPlace(c); return p ? `<li>${placeLine(c, p)}</li>` : `<li>${esc(c)}</li>`; }))).join('')
    : '';
  openModal(`
    <p class="muted">${L('🧠 Trivia')}</p>
    <h2>${esc(t.title)}</h2>
    <p class="why">${esc(t.summary)}</p>
    ${t.detail.map(d => `<p>${esc(d)}</p>`).join('')}
    ${t.check ? sec(L('🔎 Check it on the trip'), `<p>${esc(t.check)}</p>`) : ''}
    ${links ? sec(L('📍 Related places'), `<ul>${links}</ul>`) : ''}`);
}

view.addEventListener('click', e => {
  const b = e.target.closest('.place');
  if (b) return showPlace(b.dataset.code);
  const t = e.target.closest('.trivia');
  if (t) showTrivia(t.dataset.id);
});

const pf = { base: 'T', p: 'all', inc: 'all', st: 'all', q: '' };   // Places filters (kept while the page is open)
// Search ignores case, macrons and punctuation: "sensoji" finds Sensō-ji
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[-‐–'’.,()]/g, '');
let plDraw = 0;   // guards against an older search finishing after a newer one

async function renderPlaces() {
  const trip = await load('data/trip.json');
  const bases = trip?.bases || [];
  const base = bases.find(b => b.id === pf.base) || bases[0];
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) =>
    `<button data-f="${key}" data-v="${v}" class="${pf[key] === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  view.innerHTML = `
    <div class="chips" id="plBases">${bases.map(b => `<button class="chip${!pf.q.trim() && b.id === base.id ? ' on' : ''}" data-base="${b.id}"><b>${esc(b.name)}</b>${esc(b.id)}</button>`).join('')}</div>
    <div class="card"><h2 id="plTitle"></h2><p class="muted" id="plCount"></p>
      <div class="search"><input id="plSearch" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(L('🔍 Search all places'))}" value="${esc(pf.q)}"><button id="plClear" aria-label="Clear"${pf.q ? '' : ' hidden'}>✕</button></div>
      ${seg('p', [['all', L('All')], ['1', '🟢 P1'], ['2', '🟡 P2'], ['3', '⚪ P3']])}
      ${seg('inc', [['all', L('All')], ['yes', '✅'], ['maybe', '❓'], ['weather', '🌦️'], ['no', '❌']])}
      ${seg('st', [['all', L('All')], ['pending', L('⏳ Pending')], ['done', L('✔️ Done')]])}
    </div>
    <div id="plList"></div>`;
  view.querySelectorAll('[data-base]').forEach(b => b.addEventListener('click', () => { pf.base = b.dataset.base; pf.q = ''; renderPlaces(); }));
  view.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { pf[b.dataset.f] = b.dataset.v; renderPlaces(); }));
  // Typing redraws only the list, so the field keeps focus and the phone keyboard stays open
  const input = $('#plSearch'), clear = $('#plClear');
  input.addEventListener('input', () => { pf.q = input.value; clear.hidden = !pf.q; drawPlaces(trip); });
  clear.addEventListener('click', () => { pf.q = input.value = ''; clear.hidden = true; drawPlaces(trip); input.focus(); });
  await drawPlaces(trip);
}

async function drawPlaces(trip) {
  const draw = ++plDraw;
  const done = store.get('jp-place-done');
  const bases = trip?.bases || [];
  const terms = norm(pf.q).split(/\s+/).filter(Boolean);
  const scope = terms.length ? bases : [bases.find(b => b.id === pf.base) || bases[0]];
  // One list of {c, p, base}; a search covers every base, otherwise only the selected one
  const entries = [];
  for (const b of scope) {
    const file = trip?.placeFiles?.[b.id];
    const all = (file && await load(`data/${file}.json`)) || {};
    Object.keys(all).filter(c => c.startsWith(b.id) && /\d/.test(c[1]))
      .sort((x, y) => x.localeCompare(y, 'en', { numeric: true }))
      .forEach(c => entries.push({ c, p: all[c], base: b }));
  }
  if (draw !== plDraw || !$('#plList')) return;   // a newer search started, or the tab changed
  const inTitle = e => norm(`${e.c} ${e.p.name}`);
  const hit = e => { const h = norm([e.c, e.p.name, e.p.desc, e.p.why, e.p.decision, ...(e.p.see || [])].join(' ')); return terms.every(t => h.includes(t)); };
  const rank = e => terms.length === 1 && norm(e.c) === terms[0] ? 0 : terms.every(t => inTitle(e).includes(t)) ? 1 : 2;   // exact code, then name, then description
  const shown = entries.filter(e => (!terms.length || hit(e)) && (pf.p === 'all' || String(e.p.p) === pf.p) && (pf.inc === 'all' || (e.p.inc || 'maybe') === pf.inc)
    && (pf.st === 'all' || (pf.st === 'done') === !!done[e.c]));
  if (terms.length) shown.sort((x, y) => rank(x) - rank(y));   // sort is stable: code order is kept within a rank
  const dayIdx = chip => (trip.days || []).findIndex(d => d.chip === chip);
  const rows = shown.map(({ c, p, base }) => {
    const days = (p.days || []).map(ch => `<a class="daylink" data-day="${dayIdx(ch)}" data-code="${esc(c)}">${esc(ch)}</a>`).join(' ');
    return `<div class="prow ${p.inc === 'no' ? 'dropped' : ''}${done[c] ? ' done' : ''}">
      <div>${placeLine(c, p)}${mapLink(p)}</div>
      <div class="meta">${terms.length ? esc(base.name) + ' · ' : ''}${INC[p.inc || 'maybe']}${days ? ' · 📅 ' + days : ''}${p.decision ? ' · ' + esc(p.decision) : ''}</div>
    </div>`;
  }).join('');
  const base = scope[0];
  $('#plTitle').textContent = terms.length ? L('Search results') : base.name;
  $('#plCount').textContent = `${terms.length ? '' : base.nights + ' · '}${shown.length} ${L('of')} ${entries.length} ${L('places')}`;
  view.querySelectorAll('#plBases .chip').forEach(b => b.classList.toggle('on', !terms.length && b.dataset.base === base.id));
  $('#plList').innerHTML = rows ? `<div class="card plist">${rows}</div>` : placeholder(entries.length ? L('No places match these filters') : 'Places for this base are added in step 6');
  $('#plList').querySelectorAll('.daylink').forEach(a => a.addEventListener('click', () => { currentDay = +a.dataset.day; focusPlace = a.dataset.code; location.hash = 'days'; }));
}
// Bookings: data/bookings.json → "booked" / "todo"; sorted by start, grouped and filtered by city
let bkTab = 'booked', bkCity = 'all';
async function renderBookings() {
  const b = await load('data/bookings.json') || { types: {}, cities: [], booked: [], todo: [] };
  const marks = store.get('jp-bk-status');
  const all = [...(b.booked || []).map(x => [x, 'booked']), ...(b.todo || []).map(x => [x, 'todo'])]
    .map(([x, s]) => ({ ...x, _st: marks[x.id] || s }));
  const items = all.filter(x => x._st === bkTab).sort((x, y) => (x.start || '').localeCompare(y.start || ''));
  const cities = (b.cities || []).filter(c => bkCity === 'all' || c === bkCity);
  const card = async x => {
    const p = x.place ? await getPlace(x.place) : null;
    return `<button class="bkrow" data-id="${esc(x.id)}">
      <div class="meta">📅 ${esc(x.date)}${x.time ? ' · ' + esc(x.time) : ''}</div>
      <b>${esc((b.types[x.type] || '').split(' ')[0])} ${esc(x.title)}</b>${p ? `<div class="meta">${esc(x.place)} ${p.icon || ''} ${esc(p.name)}</div>` : ''}
      ${bkTab !== 'todo'
        ? (x.cancel ? `<div class="meta">↩️ ${esc(x.cancel)}</div>` : '')
        : (x.deadline ? `<div class="meta warn">⏰ ${esc(x.deadline)}</div>` : '')}
      ${x.tickets?.length ? `<div class="meta">🎟️ ${x.tickets.length} ${L(x.tickets.length > 1 ? 'tickets' : 'ticket')}</div>` : ''}
      <i>${L('Details ›')}</i></button>`;
  };
  let html = '';
  for (const c of cities) {
    const a = items.filter(x => x.city === c);
    if (a.length) html += `<div class="card"><h3>📍 ${esc(c)}</h3>${(await Promise.all(a.map(card))).join('')}</div>`;
  }
  const count = k => all.filter(x => x._st === k && (bkCity === 'all' || x.city === bkCity)).length;
  view.innerHTML = `
    <div class="card"><h2>${L('Bookings')}</h2>
      <div class="seg"><button data-bk="booked" class="${bkTab === 'booked' ? 'on' : ''}">✅ ${L('Booked')} (${count('booked')})</button>
      <button data-bk="todo" class="${bkTab === 'todo' ? 'on' : ''}">⚠️ ${L('To book')} (${count('todo')})</button>
      <button data-bk="done" class="${bkTab === 'done' ? 'on' : ''}">✔️ ${L('Passed')} (${count('done')})</button></div>
      <div class="seg">${['all', ...(b.cities || [])].map(c => `<button data-city="${esc(c)}" class="${bkCity === c ? 'on' : ''}">${c === 'all' ? L('All cities') : esc(c)}</button>`).join('')}</div>
      <p class="muted small">${L('Sorted by date and time. No PINs are stored.')}</p></div>
    ${html || placeholder(L('Nothing here'))}`;
  view.querySelectorAll('[data-bk]').forEach(x => x.addEventListener('click', () => { bkTab = x.dataset.bk; renderBookings(); }));
  view.querySelectorAll('[data-city]').forEach(x => x.addEventListener('click', () => { bkCity = x.dataset.city; renderBookings(); }));
}

async function showBooking(id, replace) {
  const b = await load('data/bookings.json') || {};
  const x = [...(b.booked || []), ...(b.todo || [])].find(y => y.id === id);
  if (!x) return;
  const st = await bkStatus(id, 'todo');
  const p = x.place ? await getPlace(x.place) : null;
  const row = (k, v) => v ? `<dt>${L(k)}</dt><dd>${esc(v)}</dd>` : '';
  const btn = {
    todo: confirmBtn('bk:booked', id, L('✅ Mark as booked'), L('Mark this as booked?')),
    booked: confirmBtn('bk:done', id, L('✔️ Mark as done'), L('Mark this booking as done?')),
    done: confirmBtn('bk:booked', id, L('↩️ Reopen'), L('Reopen this booking (back to Booked)?'))
  }[st];
  const html = `
    <p class="muted">${esc(b.types[x.type] || '')} · ${STATUS[st]}</p>
    <h2>${esc(x.title)}</h2>
    ${p ? `<p>${placeLine(x.place, p)}${mapLink(p)}</p>` : ''}
    <dl class="facts">
      ${row('📅 When', [x.date, x.time].filter(Boolean).join(', '))}
      ${row('🏢 Provider', x.provider)}
      ${row('🔖 Reference', x.ref)}
      ${row('👥 People', x.people)}
      ${row('💴 Price', x.price)}
      ${row('📍 Meet', x.meet)}
      ${row('🏁 Ends', x.ends)}
      ${row('↩️ Cancel', x.cancel)}
      ${row('📱 Voucher', x.voucher)}
      ${row('📞 How to book', x.how)}
      ${row('🔁 Fallback', x.fallback)}
      ${row('⏰ Book by', x.deadline)}
    </dl>
    ${x.tickets?.length ? sec(L('🎟️ Tickets'), x.tickets.map(t => `<figure class="ticket"><figcaption>${esc(t.label)} <span class="muted small">· ${L('tap to enlarge')}</span></figcaption><img class="tk" data-src="${esc(t.src)}" data-label="${esc(t.label)}" src="${esc(t.src)}" alt="${esc(t.label)}" loading="lazy"></figure>`).join('')) : ''}
    ${x.day ? `<p><a class="daylink" data-goday="${esc(x.day)}" data-code="${esc(x.place || '')}">${L('Open in the day plan')} (${esc(x.day)}) ›</a></p>` : ''}
    ${btn}`;
  replace ? refreshModal(html) : openModal(html);
}
document.addEventListener('click', async e => {
  const bk = e.target.closest('.bk, .bkrow');
  if (bk) return showBooking(bk.dataset.id);
  const g = e.target.closest('[data-goday]');
  if (g) {
    const trip = await load('data/trip.json');
    currentDay = trip.days.findIndex(d => d.chip === g.dataset.goday);
    focusPlace = g.dataset.code || null;
    closeModal();
    if (location.hash === '#days') renderDays(); else location.hash = 'days';
  }
});
// Info: data/info.json (+ trivia.json), one collapsible section each
const TRIVIA_GROUPS = [['general', 'Japan in general'], ['T', 'Tokyo'], ['K', 'Kyoto, Himeji and Uji'], ['Y', 'Yoshino'], ['O', 'Osaka and Nara']];
const triviaGroup = t => t.topic === 'general' || !t.places?.length ? 'general' : (t.places[0][0] === 'H' ? 'T' : t.places[0][0]);
// Phrase audio: recorded clips, a separate slow clip for the turtle; one player, so a new tap stops the previous clip
const player = new Audio();
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (!b) return;
  player.pause();
  player.src = b.dataset.say;
  player.play().catch(() => { b.textContent = '⚠️'; });
});

async function renderInfo() {
  const i = await load('data/info.json') || {};
  const tr = await load('data/trivia.json') || {};
  const audioMap = await fetchJson('audio.json') || {};
  const done = store.get('jp-checklist');
  const dl = rows => `<dl class="facts">${rows.filter(r => r[1]).map(([k, v]) => `<dt>${L(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const note = x => x.notes ? `<p class="muted small"><i>${esc(x.notes)}</i></p>` : '';
  const block = (icon, title, count, body) =>
    `<details class="card info"><summary><span>${icon} <b>${L(title)}</b></span><span class="muted">${count}</span></summary>${body}</details>`;
  const sections = [
    block('✈️', 'Flights', (i.flights || []).length, (i.flights || []).map(f =>
      `<h3>${esc(f.title)}</h3><p class="meta">${esc(f.when)}</p>${list(f.legs)}${note(f)}`).join('')),
    block('🛏️', 'Stays', (i.stays || []).length, (i.stays || []).map(s =>
      `<h3>${esc(s.title)}</h3>${dl([['📅 Dates', esc(s.when)], ['📍 Address', esc(s.address) + mapLink(s)], ['📞 Phone', esc(s.phone)],
        ['🕒 Times', esc(s.checkin)], ['🔖 Booking', esc(s.ref)], ['ℹ️ Extra', esc(s.extra)]])}${note(s)}`).join('')),
    block('🚄', 'Transfers between bases', (i.transfers || []).length, (i.transfers || []).map(t =>
      `<h3>${esc(t.title)}</h3>${dl([['📅 When', esc(t.when)], ['🚆 How', esc(t.how)], ['🧳 Luggage', esc(t.luggage)]])}${note(t)}`).join('')),
    block('🧠', 'Trivia', Object.keys(tr).length, (await Promise.all(TRIVIA_GROUPS.map(async ([key, label]) => {
      const ids = Object.keys(tr).filter(id => triviaGroup(tr[id]) === key);
      return ids.length ? `<h3>${L(label)}</h3>${await triviaList(ids)}` : '';
    }))).join('')),
    block('💬', 'Useful phrases', (i.phrases || []).length, `<p class="muted small">${L('🔊 plays the phrase, 🐢 plays it slowly.')}</p>` + (i.phrases || []).map((p, n, all) =>
      `${p.group && p.group !== all[n - 1]?.group ? `<h3>${L(p.group)}</h3>` : ''}<div class="phrase"><b>${esc(p.en)}</b><div class="jp">${esc(p.jp)}</div><div><i>${esc(p.say)}</i></div>${audioMap[p.jp] ? `<div class="say"><button data-say="${esc(audioMap[p.jp].f)}" aria-label="Play">🔊</button><button data-say="${esc(audioMap[p.jp].s)}" aria-label="Play slowly">🐢</button></div>` : ''}<div class="meta">${esc(p.use)}</div></div>`).join('')
),
    block('🚨', 'Emergency', (i.emergency || []).length, (i.emergency || []).map(e =>
      `<div class="emg"><span>${esc(e.what)}</span><b>${esc(e.number)}</b></div>`).join('')),
    block('🎒', 'Packing', (i.packing || []).length, (i.packing || []).map(p =>
      `<p><b>${esc(p.item)}</b><br><span class="meta">${esc(p.why)}</span></p>`).join('')),
    block('✅', 'Before departure', `${(i.checklist || []).filter(c => done[c.id]).length}/${(i.checklist || []).length}`,
      (i.checklist || []).map(c => `<label class="check"><input type="checkbox" data-ck="${esc(c.id)}"${done[c.id] ? ' checked' : ''}> <span>${esc(c.task)}</span></label>`).join('')
      + `<p class="muted small"><i>${L('Ticks are saved only in this browser.')}</i></p>`)
  ];
  view.innerHTML = `<div class="card"><h2>${L('Info')}</h2><p class="muted">${L('Tap a section to open it.')}</p></div>${sections.join('')}`;
  view.querySelectorAll('[data-ck]').forEach(c => c.addEventListener('change', () => {
    const d = store.get('jp-checklist'); d[c.dataset.ck] = c.checked; store.set('jp-checklist', d);
  }));
}

// ---------- Printable view (#print): days, bookings, info, trivia, then all place guides ----------
async function renderPrint() {
  view.innerHTML = placeholder('Building the printable guide…');
  const trip = await load('data/trip.json') || {};
  const [b, i, tr] = await Promise.all([load('data/bookings.json'), load('data/info.json'), load('data/trivia.json')]);
  const out = [];
  out.push(`<div class="card noprint"><h2>📄 Save as PDF</h2>
    <p class="muted small">Tap the button, then choose “Save as PDF” as the printer. On a phone you can also use the browser’s Share → Print.
    If the button does nothing, open the guide in its own browser tab and try again.</p>
    <button class="btn" id="doprint">🖨️ Print / Save as PDF</button> <a class="btn ghost" href="#info">← Back</a></div>
    <h1 class="ptitle">Japan 2026 — Trip Guide</h1><p class="muted">10–23 Nov 2026 · Tokyo · Kyoto · Yoshino · Osaka</p>`);
  // Days
  out.push('<h1 class="pbreak">📅 Days</h1>');
  for (const d of trip.days || []) {
    const data = await load(`data/days/${d.file}.json`);
    if (!data) continue;
    const items = (await Promise.all(data.items.map(renderItem))).join('');
    const triv = (data.trivia || []).filter(id => tr?.[id]).map(id => `<li>${esc(tr[id].title)}</li>`).join('');
    out.push(`<section class="pday"><h2>${esc(d.chip)} · ${esc(d.label)} · ${esc(data.title)}</h2>
      <p class="muted">${esc(d.base)} · pace: ${esc(data.pace)}${data.stay ? ' · 🛏️ ' + esc(data.stay) : ''}</p>
      <div class="timeline">${items}</div>${triv ? `<p><b>🧠 Trivia today:</b></p><ul>${triv}</ul>` : ''}</section>`);
  }
  // Bookings
  const marks = store.get('jp-bk-status');
  const bks = [...(b?.booked || []).map(x => [x, 'booked']), ...(b?.todo || []).map(x => [x, 'todo'])]
    .map(([x, s]) => [x, marks[x.id] || s]).sort((x, y) => (x[0].start || '').localeCompare(y[0].start || ''));
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  out.push('<h1 class="pbreak">🎫 Bookings</h1>' + bks.map(([x, s]) => `<div class="card"><h3>${esc((b.types[x.type] || '').split(' ')[0])} ${esc(x.title)} ${STATUS[s]}</h3>
    <dl class="facts">${row('📅 When', [x.date, x.time].filter(Boolean).join(', '))}${row('🏙️ City', x.city)}${row('🏢 Provider', x.provider)}
    ${row('🔖 Reference', x.ref)}${row('👥 People', x.people)}${row('💴 Price', x.price)}${row('📍 Meet', x.meet)}${row('🏁 Ends', x.ends)}
    ${row('↩️ Cancel', x.cancel)}${row('📱 Voucher', x.voucher)}${row('📞 How to book', x.how)}${row('🔁 Fallback', x.fallback)}${row('⏰ Book by', x.deadline)}</dl></div>`).join(''));
  // Info (all sections open)
  const dl = rows => `<dl class="facts">${rows.filter(r => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  out.push(`<h1 class="pbreak">ℹ️ Info</h1>
    <h2>✈️ Flights</h2>${(i?.flights || []).map(f => `<div class="card"><h3>${esc(f.title)}</h3><p class="meta">${esc(f.when)}</p>${list(f.legs)}<p class="muted small">${esc(f.notes || '')}</p></div>`).join('')}
    <h2>🛏️ Stays</h2>${(i?.stays || []).map(s => `<div class="card"><h3>${esc(s.title)}</h3>${dl([['📅 Dates', esc(s.when)], ['📍 Address', esc(s.address) + mapLink(s)], ['📞 Phone', esc(s.phone)], ['🕒 Times', esc(s.checkin)], ['🔖 Booking', esc(s.ref)], ['ℹ️ Extra', esc(s.extra)], ['📝 Notes', esc(s.notes)]])}</div>`).join('')}
    <h2>🚄 Transfers between bases</h2>${(i?.transfers || []).map(t => `<div class="card"><h3>${esc(t.title)}</h3>${dl([['📅 When', esc(t.when)], ['🚆 How', esc(t.how)], ['🧳 Luggage', esc(t.luggage)], ['📝 Notes', esc(t.notes)]])}</div>`).join('')}
    <h2>🚨 Emergency</h2><div class="card">${(i?.emergency || []).map(e => `<div class="emg"><span>${esc(e.what)}</span><b>${esc(e.number)}</b></div>`).join('')}</div>
    <h2>💬 Useful phrases</h2><div class="card">${(i?.phrases || []).map(p => `<div class="phrase"><b>${esc(p.en)}</b> — <span class="jp">${esc(p.jp)}</span> <i>${esc(p.say)}</i><div class="meta">${esc(p.use)}</div></div>`).join('')}</div>
    <h2>🎒 Packing</h2><div class="card"><ul>${(i?.packing || []).map(p => `<li><b>${esc(p.item)}</b> — ${esc(p.why)}</li>`).join('')}</ul></div>
    <h2>✅ Before departure</h2><div class="card">${(i?.checklist || []).map(c => `<p>☐ ${esc(c.task)}</p>`).join('')}</div>`);
  // Trivia
  out.push('<h1 class="pbreak">🧠 Trivia</h1>' + Object.values(tr || {}).map(t => `<div class="card"><h3>${esc(t.title)}</h3><p class="why">${esc(t.summary)}</p>
    ${(t.detail || []).map(d => `<p>${esc(d)}</p>`).join('')}${t.check ? `<p><b>🔎 Check it:</b> ${esc(t.check)}</p>` : ''}
    ${t.places?.length ? `<p class="muted small">Places: ${esc(t.places.join(', '))}</p>` : ''}</div>`).join(''));
  // Place guides, by base
  out.push('<h1 class="pbreak">📍 Place guides</h1>');
  for (const base of trip.bases || []) {
    const all = await load(`data/${trip.placeFiles[base.id]}.json`) || {};
    const codes = Object.keys(all).filter(c => c.startsWith(base.id) && /\d/.test(c[1]))
      .sort((a, c) => a.localeCompare(c, 'en', { numeric: true }));
    if (!codes.length) continue;
    out.push(`<h2 class="pbreak">${esc(base.name)}</h2>`);
    for (const c of codes) out.push(`<div class="card pplace">${await placeHtml(c, all[c])}</div>`);
  }
  if (currentTab !== 'print') return;   // left the page while building
  view.innerHTML = `<div class="pr">${out.join('')}</div>`;
  $('#doprint')?.addEventListener('click', () => { try { window.print(); } catch {} });
}

// ---------- Router (#days, #places, #bookings, #info, #print) ----------
const pages = { days: renderDays, places: renderPlaces, bookings: renderBookings, info: renderInfo, print: renderPrint };
function route() {
  const tab = pages[location.hash.slice(1)] ? location.hash.slice(1) : 'days';
  currentTab = tab;
  document.body.classList.toggle('printview', tab === 'print');
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === (tab === 'print' ? 'info' : tab)));
  closeModal();
  window.scrollTo(0, 0);
  pages[tab]();
}
window.addEventListener('hashchange', route);
route();

// Full-screen ticket preview with zoom (pinch may be limited inside the frame, so buttons too)
const viewer = document.createElement('div');
viewer.className = 'viewer'; viewer.hidden = true;
viewer.innerHTML = `<div class="vbar"><span class="vlabel"></span>
  <button data-z="-1" aria-label="Zoom out">−</button><button data-z="1" aria-label="Zoom in">+</button>
  <button class="vclose" aria-label="Close">✕</button></div><div class="vscroll"><img alt=""></div>`;
document.body.appendChild(viewer);
let zoom = 1;
const setZoom = z => { zoom = Math.min(4, Math.max(1, z)); viewer.querySelector('img').style.width = (zoom * 100) + '%'; };
document.addEventListener('click', e => {
  const t = e.target.closest('img.tk');
  if (t) {
    viewer.querySelector('img').src = t.dataset.src;
    viewer.querySelector('.vlabel').textContent = t.dataset.label;
    setZoom(1); viewer.hidden = false;
    return;
  }
  if (e.target.closest('.vclose')) viewer.hidden = true;
  const z = e.target.closest('[data-z]');
  if (z) setZoom(zoom + (+z.dataset.z));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') viewer.hidden = true; });
