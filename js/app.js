'use strict';
/* Поведение страницы: выбор региона и дня, избранное, настройки, геолокация, обновление данных, запуск */

let menuOpen = false, setOpen = false, closeT = 0, installEvt = null, lastLoad = 0, toastT = 0, pvIdx = 0;
const selbtn = $('#selbtn'), menu = $('#menu'), setbtn = $('#setbtn'), setpop = $('#setpop');

/* ---------- Отрисовка и плавная смена блоков ---------- */
const RENDERERS = {alerts:renderAlerts, hero:renderHero, hourly:renderHourly, week:renderWeek, air:renderAir, tips:renderTips, map:renderMap};
const renderSec = n => RENDERERS[n](secEl(n));
function renderAll(quiet) { SECS.forEach(n => { secEl(n).classList.toggle('quiet', !!quiet); renderSec(n); }); }
function quietRender(n) { secEl(n).classList.add('quiet'); renderSec(n); }
function swap(names) {
  names.forEach(n => {
    const w = secEl(n);
    if (calm) { w.classList.remove('quiet'); renderSec(n); return; }
    w.classList.remove('enter'); w.classList.add('out');
    clearTimeout(w._t);
    w._t = setTimeout(() => {
      w.classList.remove('quiet'); renderSec(n);
      w.classList.remove('out'); void w.offsetWidth; w.classList.add('enter');
    }, 240);
  });
}
function refreshChrome() { renderSelBtn(); renderMenu(); renderFavs(); }

/* ---------- Небо ---------- */
function applyScene() {
  const d = curData(); if (!d) return;
  const i = dayIdx(d), x = d.days[i];
  let code = i === 0 ? d.cur.code : x.code, isDay = i === 0 ? d.cur.isDay : true, wind = i === 0 ? d.cur.wind : x.wmax;
  const o = state.override;
  if (o) { code = o.code; if (o.isDay !== null) isDay = o.isDay; }
  Sky.set(code, isDay, wind);
}
const PREVIEWS = [['real', null], ['clear', {code:0, isDay:true}], ['night', {code:0, isDay:false}], ['cloudy', {code:3, isDay:null}],
  ['rain', {code:65, isDay:null}], ['storm', {code:95, isDay:null}], ['snow', {code:73, isDay:null}], ['fog', {code:45, isDay:null}]];
function buildPreview() {
  const fx = $('#fx');
  fx.innerHTML = `<span>${t('previewLabel')}</span>`;
  PREVIEWS.forEach(([k, o], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = t('pv_' + k); b.setAttribute('aria-pressed', i === pvIdx);
    b.onclick = () => {
      pvIdx = i; state.override = o; applyScene();
      fx.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', j === i));
    };
    fx.appendChild(b);
  });
}

/* ---------- Выбор региона и дня ---------- */
function select(id) {
  if (id === state.current) return;
  state.current = id; store.set('uz-weather-region', id);
  refreshChrome(); applyScene();
  swap(['alerts', 'hero', 'hourly', 'week', 'air', 'tips']); quietRender('map');
}
function selectDay(i) {
  if (i === state.day) return;
  state.day = i;
  $$('.row').forEach(b => b.setAttribute('aria-pressed', +b.dataset.day === i));
  refreshChrome(); applyScene();
  swap(['alerts', 'hero', 'hourly', 'air', 'tips']); quietRender('map');
  if (innerWidth < 960) $('#s-hero').scrollIntoView({behavior:calm ? 'auto' : 'smooth', block:'start'});
}

/* ---------- Выпадающий список регионов ---------- */
function openMenu() {
  if (menuOpen) return;
  closeSettings();
  menuOpen = true; clearTimeout(closeT);
  menu.hidden = false; selbtn.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('open')));
  const cur = menu.querySelector('[aria-selected="true"]');
  setTimeout(() => { if (cur) { cur.focus({preventScroll:true}); cur.scrollIntoView({block:'nearest'}); } }, 40);
}
function closeMenu(focusBtn) {
  if (!menuOpen) return;
  menuOpen = false; menu.classList.remove('open'); selbtn.setAttribute('aria-expanded', 'false');
  closeT = setTimeout(() => { menu.hidden = true; }, 230);
  if (focusBtn) selbtn.focus();
}

/* ---------- Настройки ---------- */
const SET_UI = [['theme', [['dark', 'dark'], ['light', 'light']]], ['temp', [['c', '°C'], ['f', '°F']]],
  ['wind', [['ms', 'ms'], ['kmh', 'kmh']]], ['press', [['mmhg', 'mmhg'], ['hpa', 'hpa']]]];
const SET_LABEL = {theme:'theme', temp:'temperature', wind:'windSet', press:'pressureSet'};
function renderSettings() {
  setpop.innerHTML = `<div class="sp-t">${t('settings')}</div>`
    + SET_UI.map(([k, opts]) => `<div class="sp-r"><span>${t(SET_LABEL[k])}</span><div class="seg" role="group" aria-label="${t(SET_LABEL[k])}">`
      + opts.map(([v, lab]) => `<button type="button" data-set="${k}" data-val="${v}" aria-pressed="${settings[k] === v}">${k === 'temp' ? lab : t(lab)}</button>`).join('') + '</div></div>').join('')
    + (installEvt ? `<button type="button" class="install" id="installBtn">${t('install')}</button>` : '');
}
function openSettings() { closeMenu(); setOpen = true; renderSettings(); setpop.hidden = false; setbtn.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => requestAnimationFrame(() => setpop.classList.add('open'))); }
function closeSettings(focusBtn) {
  if (!setOpen) return;
  setOpen = false; setpop.classList.remove('open'); setbtn.setAttribute('aria-expanded', 'false');
  setTimeout(() => { if (!setOpen) setpop.hidden = true; }, 200);
  if (focusBtn) setbtn.focus();
}
function setSetting(k, v) {
  if (settings[k] === v) return;
  settings[k] = v; saveSettings();
  if (k === 'theme') { applyTheme(); renderSettings(); return; }
  if (k === 'lang') { LANG = v; renderChrome(); buildPreview(); tick(); updateFooter(); showBanner(); }
  shown = null; renderAll(true); refreshChrome(); renderSettings();
}

/* ---------- Избранное и геопозиция ---------- */
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 4200);
}
function toggleFav() {
  const id = state.current, k = state.favs.indexOf(id);
  if (k >= 0) state.favs.splice(k, 1); else state.favs.push(id);
  store.set('uz-weather-favs', state.favs); refreshChrome();
  toast(t(k >= 0 ? 'favRemoved' : 'favAdded', {name:rname(region())}));
}
function locate() {
  if (!navigator.geolocation) { toast(t('locFail')); return; }
  const b = $('#locbtn'); b.classList.add('busy');
  navigator.geolocation.getCurrentPosition(pos => {
    b.classList.remove('busy');
    const {region:r, km} = nearestRegion(pos.coords.latitude, pos.coords.longitude);
    toast(t(km > 450 ? 'locFar' : 'locOk', {name:rname(r)}));
    select(r.id);
  }, err => { b.classList.remove('busy'); toast(t(err && err.code === 1 ? 'locDenied' : 'locFail')); }, {timeout:10000, maximumAge:600000});
}

/* ---------- Часы, подвал, плашка ---------- */
function tick() { const T = tz(); $('#clock').textContent = `${nm().wdL[T.wd]}, ${dmLong(T)}, ${p2(T.h)}:${p2(T.mi)}`; }
function updateFooter() {
  if (!state.updated) return;
  const T = tz(state.updated); $('#updated').textContent = t('updated', {t:`${p2(T.h)}:${p2(T.mi)}`});
}
function showBanner() {
  const b = $('#banner');
  if (state.demo) b.innerHTML = `<span>${t('demoBanner')}</span><button type="button" id="retry">${t('retry')}</button>`;
  else if (state.stale) { const T = tz(state.updated); b.innerHTML = `<span>${t('staleBanner', {t:`${p2(T.h)}:${p2(T.mi)}`})}</span><button type="button" id="retry">${t('retry')}</button>`; }
  b.hidden = !(state.demo || state.stale);
}

/* ---------- Обновление данных ---------- */
async function refresh() {
  const first = !Object.keys(state.data).length;
  await loadData(); lastLoad = Date.now();
  showBanner(); refreshChrome(); applyScene(); updateFooter();
  if (first) SECS.forEach(n => secEl(n).classList.add('enter'));
  renderAll(!first);
}

/* ---------- События ---------- */
function bind() {
  selbtn.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
  selbtn.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(); } });
  menu.addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return; select(b.dataset.id); closeMenu(true); });
  menu.addEventListener('keydown', e => {
    const opts = [...menu.querySelectorAll('.opt')], i = opts.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
    else if (e.key === 'Tab') closeMenu();
    else if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); opts[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); opts[opts.length - 1].focus(); }
  });
  $('#favbtn').addEventListener('click', toggleFav);
  $('#locbtn').addEventListener('click', locate);
  $('#langseg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSetting('lang', b.dataset.lang); });
  setbtn.addEventListener('click', () => setOpen ? closeSettings() : openSettings());
  setpop.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'installBtn' && installEvt) {
      installEvt.prompt(); try { await installEvt.userChoice; } catch (err) {} installEvt = null; renderSettings(); return;
    }
    if (b.dataset.set) setSetting(b.dataset.set, b.dataset.val);
  });
  document.addEventListener('pointerdown', e => {
    if (menuOpen && !e.target.closest('#select')) closeMenu();
    if (setOpen && !e.target.closest('.setwrap')) closeSettings();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && setOpen) closeSettings(true); });
  $('#s-week').addEventListener('click', e => { const b = e.target.closest('.row'); if (b) selectDay(+b.dataset.day); });
  $('#s-hero').addEventListener('click', e => { if (e.target.closest('[data-back]')) selectDay(0); });
  $('#favs').addEventListener('click', e => { const b = e.target.closest('.fchip'); if (b) select(b.dataset.id); });
  $('#banner').addEventListener('click', e => { if (e.target.closest('#retry')) refresh(); });
  const mapEl = $('#s-map');
  const pick = id => { select(id); if (innerWidth < 960) $('#s-hero').scrollIntoView({behavior:calm ? 'auto' : 'smooth', block:'start'}); };
  mapEl.addEventListener('click', e => { const p = e.target.closest('[data-id]'); if (p) pick(p.dataset.id); });
  mapEl.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const p = e.target.closest('[data-id]'); if (p) { e.preventDefault(); pick(p.dataset.id); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastLoad > 10 * 60e3) refresh(); });
  addEventListener('online', () => refresh());
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (setOpen) renderSettings(); });
  addEventListener('appinstalled', () => { installEvt = null; toast(t('installDone')); if (setOpen) renderSettings(); });
}

/* ---------- Запуск ---------- */
(function init() {
  const rid = store.get('uz-weather-region', null); if (regionById(rid)) state.current = rid;
  state.favs = (store.get('uz-weather-favs', []) || []).filter(id => regionById(id));
  applyTheme(); renderChrome(); buildPreview(); renderSettings(); bind();
  renderSelBtn(); renderMenu(); renderFavs(); renderAll(false); tick();
  setInterval(tick, 20000);
  refresh(); setInterval(refresh, 15 * 60 * 1000);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
